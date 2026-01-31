#!/usr/bin/env node
// Simple proxy that watches OpenClaw session files and broadcasts Telegram messages via SSE

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 3001;
const clients = new Set();
const HOME = process.env.HOME || '/Users/gigi';
const SESSIONS_DIR = process.env.SESSIONS_DIR || path.join(HOME, '.openclaw/agents/main/sessions');
const OPENCLAW_ENV_FILE = path.join(HOME, '.openclaw/.env');

// Base URL for preview links (set this to your server's public URL)
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

// Load Telegram Bot Token - checks multiple sources in priority order
function loadTelegramToken() {
  // 1. Environment variable (highest priority)
  if (process.env.TELEGRAM_BOT_TOKEN) {
    console.log('[CONFIG] Using TELEGRAM_BOT_TOKEN from environment');
    return process.env.TELEGRAM_BOT_TOKEN;
  }

  // 2. Local .env file in project directory
  const localEnvFile = path.join(__dirname, '.env');
  try {
    if (fs.existsSync(localEnvFile)) {
      const envContent = fs.readFileSync(localEnvFile, 'utf-8');
      const match = envContent.match(/TELEGRAM_BOT_TOKEN=(.+)/);
      if (match) {
        console.log('[CONFIG] Using TELEGRAM_BOT_TOKEN from local .env');
        return match[1].trim();
      }
    }
  } catch (e) {
    // Ignore errors, try next source
  }

  // 3. OpenClaw's .env file (fallback for local development)
  try {
    if (fs.existsSync(OPENCLAW_ENV_FILE)) {
      const envContent = fs.readFileSync(OPENCLAW_ENV_FILE, 'utf-8');
      const match = envContent.match(/TELEGRAM_BOT_TOKEN=(.+)/);
      if (match) {
        console.log('[CONFIG] Using TELEGRAM_BOT_TOKEN from OpenClaw config');
        return match[1].trim();
      }
    }
  } catch (e) {
    // Ignore errors
  }

  return null;
}

const TELEGRAM_BOT_TOKEN = loadTelegramToken();
const TELEGRAM_API_URL = TELEGRAM_BOT_TOKEN
  ? `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
  : null;

// In-memory newsletter storage (shared with frontend via API)
const newsletters = new Map();

// Helper to parse request body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

// Send message to Telegram via Bot API
async function sendToTelegram(chatId, message) {
  if (!TELEGRAM_API_URL) {
    console.log('[TELEGRAM] No bot token configured. Message would be sent to chat', chatId + ':');
    console.log('[TELEGRAM] Message:', message);
    // Broadcast to UI so we can see what would be sent
    broadcast({
      type: 'telegram:outgoing:preview',
      chatId,
      message,
      note: 'Bot token not configured - message not actually sent',
      timestamp: new Date().toISOString(),
    });
    return false;
  }

  try {
    const https = require('https');
    const url = require('url');

    const payload = JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown',
    });

    const urlParts = url.parse(TELEGRAM_API_URL);

    return new Promise((resolve) => {
      const req = https.request({
        hostname: urlParts.hostname,
        path: urlParts.path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            console.log('[TELEGRAM] Message sent successfully to chat', chatId);
            resolve(true);
          } else {
            console.error('[TELEGRAM] API error:', res.statusCode, data);
            resolve(false);
          }
        });
      });

      req.on('error', (err) => {
        console.error('[TELEGRAM] Request error:', err.message);
        resolve(false);
      });

      req.write(payload);
      req.end();
    });
  } catch (err) {
    console.error('[TELEGRAM] Failed to send:', err.message);
    return false;
  }
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Parse URL and extract path
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // SSE endpoint
  if (pathname === '/events' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
    clients.add(res);
    console.log(`[SSE] Client connected. Total: ${clients.size}`);

    req.on('close', () => {
      clients.delete(res);
      console.log(`[SSE] Client disconnected. Total: ${clients.size}`);
    });
    return;
  }

  // History endpoint
  if (pathname === '/history' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const messages = loadMessageHistory();
    res.end(JSON.stringify({ messages }));
    return;
  }

  // Send message to Telegram
  if (pathname === '/send' && req.method === 'POST') {
    try {
      const { chatId, message } = await parseBody(req);

      if (!chatId || !message) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'chatId and message are required' }));
        return;
      }

      const success = await sendToTelegram(chatId, message);

      // Also broadcast to SSE clients for UI update
      broadcast({
        type: 'telegram:outgoing',
        chatId,
        message,
        timestamp: new Date().toISOString(),
      });

      res.writeHead(success ? 200 : 500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success }));
    } catch (err) {
      console.error('[SEND] Error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // Store newsletter
  if (pathname === '/newsletter' && req.method === 'POST') {
    try {
      const newsletter = await parseBody(req);

      if (!newsletter.id || !newsletter.subject || !newsletter.body) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'id, subject, and body are required' }));
        return;
      }

      newsletters.set(newsletter.id, {
        ...newsletter,
        createdAt: newsletter.createdAt || new Date().toISOString(),
        status: newsletter.status || 'pending-review',
      });

      console.log(`[NEWSLETTER] Stored: ${newsletter.id}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, id: newsletter.id }));
    } catch (err) {
      console.error('[NEWSLETTER] Error storing:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // Get newsletter by ID
  const newsletterMatch = pathname.match(/^\/newsletter\/([^/]+)$/);
  if (newsletterMatch && req.method === 'GET') {
    const id = newsletterMatch[1];
    const newsletter = newsletters.get(id);

    if (!newsletter) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Newsletter not found' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(newsletter));
    return;
  }

  // Approve newsletter
  const approveMatch = pathname.match(/^\/newsletter\/([^/]+)\/approve$/);
  if (approveMatch && req.method === 'POST') {
    const id = approveMatch[1];
    const newsletter = newsletters.get(id);

    if (!newsletter) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Newsletter not found' }));
      return;
    }

    newsletter.status = 'approved';
    newsletters.set(id, newsletter);

    // Notify via Telegram
    if (newsletter.chatId) {
      await sendToTelegram(
        newsletter.chatId,
        '✅ Newsletter approved and ready to send!'
      );
    }

    // Broadcast update
    broadcast({
      type: 'newsletter:approved',
      newsletterId: id,
      timestamp: new Date().toISOString(),
    });

    console.log(`[NEWSLETTER] Approved: ${id}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // Reject newsletter
  const rejectMatch = pathname.match(/^\/newsletter\/([^/]+)\/reject$/);
  if (rejectMatch && req.method === 'POST') {
    const id = rejectMatch[1];
    const newsletter = newsletters.get(id);

    if (!newsletter) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Newsletter not found' }));
      return;
    }

    try {
      const { feedback } = await parseBody(req);

      newsletter.status = 'rejected';
      newsletter.feedback = feedback || 'No feedback provided';
      newsletters.set(id, newsletter);

      // Notify via Telegram
      if (newsletter.chatId) {
        await sendToTelegram(
          newsletter.chatId,
          `📝 Newsletter needs revision.\n\nFeedback: ${newsletter.feedback}\n\nPlease provide updated details and we'll generate a new version.`
        );
      }

      // Broadcast update
      broadcast({
        type: 'newsletter:rejected',
        newsletterId: id,
        feedback: newsletter.feedback,
        timestamp: new Date().toISOString(),
      });

      console.log(`[NEWSLETTER] Rejected: ${id}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      console.error('[NEWSLETTER] Error rejecting:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // List all newsletters
  if (pathname === '/newsletters' && req.method === 'GET') {
    const list = Array.from(newsletters.values());
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ newsletters: list }));
    return;
  }

  // Serve static files from dist/ directory (production)
  const distDir = path.join(__dirname, 'dist');
  if (fs.existsSync(distDir)) {
    let filePath = path.join(distDir, pathname === '/' ? 'index.html' : pathname);

    // For SPA routing - serve index.html for non-file paths
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distDir, 'index.html');
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
      };
      const contentType = mimeTypes[ext] || 'application/octet-stream';

      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
      return;
    }
  }

  // Default API status page (when no dist/ exists)
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <h1>MoneyChat Proxy</h1>
    <h2>Endpoints:</h2>
    <ul>
      <li>GET /events - SSE endpoint</li>
      <li>GET /history - Message history</li>
      <li>POST /send - Send message to Telegram</li>
      <li>POST /newsletter - Store newsletter</li>
      <li>GET /newsletter/:id - Get newsletter</li>
      <li>POST /newsletter/:id/approve - Approve newsletter</li>
      <li>POST /newsletter/:id/reject - Reject newsletter</li>
      <li>GET /newsletters - List all newsletters</li>
    </ul>
    <p>SSE Clients: ${clients.size}</p>
    <p>Stored Newsletters: ${newsletters.size}</p>
    <p><em>Note: Build the frontend with 'npm run build' to serve the UI</em></p>
  `);
});

function broadcast(data) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  console.log('[BROADCAST]', JSON.stringify(data));
  clients.forEach(client => {
    try {
      client.write(message);
    } catch (e) {
      clients.delete(client);
    }
  });
}

// Parse Telegram message from session format: [Telegram <username> id:<userId> ...] <message>
function parseTelegramMessage(text) {
  const match = text.match(/^\[Telegram\s+(\S+)\s+id:(\d+)[^\]]*\]\s*(.*)$/s);
  if (match) {
    return {
      username: match[1],
      userId: match[2],
      content: match[3].trim()
    };
  }
  return null;
}

// Load all existing Telegram messages from session file
function loadMessageHistory() {
  const sessionFile = findSessionFile();
  if (!sessionFile || !fs.existsSync(sessionFile)) {
    return [];
  }

  const messages = [];
  try {
    const content = fs.readFileSync(sessionFile, 'utf-8');
    const lines = content.split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line);
        if (entry.type === 'message' && entry.message?.role === 'user') {
          const msgContent = entry.message.content;
          if (Array.isArray(msgContent)) {
            for (const part of msgContent) {
              if (part.type === 'text' && part.text) {
                const parsed = parseTelegramMessage(part.text);
                if (parsed) {
                  messages.push({
                    type: 'telegram:message',
                    from: parsed.username,
                    userId: parsed.userId,
                    content: parsed.content,
                    chatId: parsed.userId,
                    messageType: 'text',
                    timestamp: entry.timestamp || new Date().toISOString(),
                  });
                }
              }
            }
          }
        }
      } catch (e) {
        // Skip invalid lines
      }
    }
  } catch (e) {
    console.error('[HISTORY] Error loading history:', e.message);
  }

  console.log(`[HISTORY] Loaded ${messages.length} messages`);
  return messages;
}

// Find and watch the active session file
function findSessionFile() {
  try {
    const sessionsJson = path.join(SESSIONS_DIR, 'sessions.json');
    if (!fs.existsSync(sessionsJson)) {
      console.log('[SESSION] sessions.json not found, retrying...');
      return null;
    }

    const sessions = JSON.parse(fs.readFileSync(sessionsJson, 'utf-8'));

    // Find session with telegram origin
    for (const [key, session] of Object.entries(sessions)) {
      if (session.origin?.provider === 'telegram' && session.sessionId) {
        // Construct path from session ID (don't use stored absolute path)
        const sessionFile = path.join(SESSIONS_DIR, `${session.sessionId}.jsonl`);
        if (fs.existsSync(sessionFile)) {
          return sessionFile;
        }
      }
    }

    // Fall back to any .jsonl file in sessions dir
    const files = fs.readdirSync(SESSIONS_DIR).filter(f => f.endsWith('.jsonl'));
    if (files.length > 0) {
      return path.join(SESSIONS_DIR, files[0]);
    }
  } catch (e) {
    console.error('[SESSION] Error finding session:', e.message);
  }
  return null;
}

// Watch session JSONL file for new messages
function watchSession() {
  const sessionFile = findSessionFile();

  if (!sessionFile) {
    console.log('[SESSION] No session file found, retrying in 3s...');
    setTimeout(watchSession, 3000);
    return;
  }

  console.log(`[SESSION] Watching: ${sessionFile}`);

  const tail = spawn('tail', ['-f', '-n', '0', sessionFile]);

  tail.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const entry = JSON.parse(line);

        // Only process user messages (incoming from Telegram)
        if (entry.type === 'message' && entry.message?.role === 'user') {
          const content = entry.message.content;

          // Handle text content
          if (Array.isArray(content)) {
            for (const part of content) {
              if (part.type === 'text' && part.text) {
                const parsed = parseTelegramMessage(part.text);
                if (parsed) {
                  const msg = {
                    type: 'telegram:message',
                    from: parsed.username,
                    userId: parsed.userId,
                    content: parsed.content,
                    chatId: parsed.userId,
                    messageType: 'text',
                    timestamp: entry.timestamp || new Date().toISOString(),
                  };
                  broadcast(msg);
                }
              }
            }
          }
        }
      } catch (e) {
        // Not JSON or parse error, ignore
      }
    }
  });

  tail.on('close', () => {
    console.log('[SESSION] Tail closed, restarting...');
    setTimeout(watchSession, 1000);
  });

  tail.on('error', (err) => {
    console.error('[SESSION] Error:', err);
    setTimeout(watchSession, 3000);
  });
}

server.listen(PORT, () => {
  console.log(`
========================================
  MoneyChat Proxy Server
========================================
  SSE Endpoint:  http://localhost:${PORT}/events
  Status Page:   http://localhost:${PORT}/
  Send Message:  POST http://localhost:${PORT}/send
  Newsletters:   http://localhost:${PORT}/newsletters
  Watching:      OpenClaw session files

  Telegram Bot:  ${TELEGRAM_BOT_TOKEN ? 'Configured ✓' : 'Not configured (set TELEGRAM_BOT_TOKEN)'}
========================================
`);
  watchSession();
});
