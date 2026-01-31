// Simple proxy server to bridge OpenClaw events to the Virtual Office UI
const http = require('http');
const WebSocket = require('ws');

const PORT = 3001;
const OPENCLAW_URL = 'http://127.0.0.1:18789';
const OPENCLAW_TOKEN = '7e0bbcbdec1b2ca66013efc07061d029463aeeee36a76756';

// Store connected clients
const clients = new Set();

// Create HTTP server for SSE
const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/events') {
    // Server-Sent Events endpoint
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    // Send initial connected event
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

    clients.add(res);
    console.log(`Client connected. Total: ${clients.size}`);

    req.on('close', () => {
      clients.delete(res);
      console.log(`Client disconnected. Total: ${clients.size}`);
    });
  } else if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', clients: clients.size }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// Broadcast to all connected clients
function broadcast(data) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach(client => {
    try {
      client.write(message);
    } catch (e) {
      clients.delete(client);
    }
  });
}

// Poll OpenClaw for new messages using the CLI
const { exec } = require('child_process');

let lastMessageId = null;

function pollOpenClaw() {
  // Use openclaw CLI to get recent messages
  exec('openclaw sessions list --json 2>/dev/null', (error, stdout) => {
    if (error) {
      // Silently ignore errors
      return;
    }
    try {
      const sessions = JSON.parse(stdout);
      // Process sessions if needed
    } catch (e) {
      // Ignore parse errors
    }
  });
}

// Start polling every 5 seconds
// setInterval(pollOpenClaw, 5000);

// For demo: Also create a WebSocket server to receive simulated messages
const wss = new WebSocket.Server({ server, path: '/ws' });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received:', data);

      // Broadcast to SSE clients
      broadcast(data);
    } catch (e) {
      console.error('Invalid message:', e);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// Watch OpenClaw logs for new Telegram messages
const { spawn } = require('child_process');

function watchOpenClawLogs() {
  const logFile = `/tmp/openclaw/openclaw-${new Date().toISOString().split('T')[0]}.log`;

  console.log(`Watching log file: ${logFile}`);

  const tail = spawn('tail', ['-f', logFile]);

  tail.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (!line.trim()) return;

      try {
        const log = JSON.parse(line);

        // Check for Telegram messages
        if (log[1] && typeof log[1] === 'object') {
          const content = log[1];

          // Look for telegram message events
          if (content.channel === 'telegram' ||
              (content.event && content.event.includes('telegram')) ||
              (log[0] && log[0].includes('telegram'))) {

            console.log('Telegram event detected:', content);

            // Extract message data
            const messageData = {
              type: 'telegram:message',
              from: content.from || content.username || 'User',
              content: content.text || content.message || content.content || '[Message]',
              chatId: content.chatId || content.chat_id || 'unknown',
              timestamp: new Date().toISOString(),
            };

            broadcast(messageData);
          }
        }
      } catch (e) {
        // Not JSON, ignore
      }
    });
  });

  tail.stderr.on('data', (data) => {
    console.error('Tail error:', data.toString());
  });

  tail.on('close', (code) => {
    console.log('Tail process exited, restarting...');
    setTimeout(watchOpenClawLogs, 1000);
  });
}

server.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log(`SSE endpoint: http://localhost:${PORT}/events`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws`);

  // Start watching logs
  watchOpenClawLogs();
});
