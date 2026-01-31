#!/usr/bin/env node
// Simple proxy that watches OpenClaw session files and broadcasts Telegram messages via SSE

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

const PORT = 3001;
const clients = new Set();
const HOME = process.env.HOME || '/Users/gigi';
const SESSIONS_DIR = path.join(HOME, '.openclaw/agents/main/sessions');

// Create HTTP server
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/events') {
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
  } else if (req.url === '/history') {
    // Return existing message history from session file
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const messages = loadMessageHistory();
    res.end(JSON.stringify({ messages }));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<h1>MoneyChat Proxy</h1><p>SSE endpoint: /events</p><p>History: /history</p><p>Clients: ${clients.size}</p>`);
  }
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
      if (session.origin?.provider === 'telegram' && session.sessionFile) {
        return session.sessionFile;
      }
    }

    // Fall back to any session with a file
    for (const [key, session] of Object.entries(sessions)) {
      if (session.sessionFile && fs.existsSync(session.sessionFile)) {
        return session.sessionFile;
      }
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
  SSE Endpoint: http://localhost:${PORT}/events
  Status Page:  http://localhost:${PORT}/
  Watching:     OpenClaw session files
========================================
`);
  watchSession();
});
