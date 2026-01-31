# MoneyChat

Outsource the boring but important work to AI Freelancers

## Overview

MoneyChat is a personal AI assistant platform for content creators and solopreneurs. Instead of dealing with complex automation tools, you interact with AI "freelancers" through familiar channels like Telegram and WhatsApp.

**Target User**: Chiara - an Instagram/TikTok content creator who needs help with:
- Newsletter writing
- Brand deal negotiations
- Contract reviews
- Content ideation
- Administrative tasks

## Quick Start

### 1. Install OpenClaw (AI Gateway)

```bash
# Install OpenClaw globally
npm install -g openclaw@latest

# Run the onboarding wizard
openclaw onboard --install-daemon

# Start the gateway
openclaw gateway
```

### 2. Configure Telegram Bot

1. Message @BotFather on Telegram
2. Create a new bot with `/newbot`
3. Add the token to `~/.openclaw/.env`:
   ```
   TELEGRAM_BOT_TOKEN=your-token-here
   ```
4. Restart the gateway: `openclaw gateway restart`

### 3. Run Virtual Office UI

**Option A: Docker (Recommended)**
```bash
git clone https://github.com/jonathanmv/cursor-hh-hackathon.git
cd cursor-hh-hackathon
docker compose up
```

**Option B: Local Development**
```bash
cd virtual-office
npm install
npm run dev
```

### 4. Pair Your Telegram Account

1. Message your bot on Telegram
2. You'll receive a pairing code
3. Run: `openclaw pairing approve telegram <CODE>`

Open http://localhost:5173 - you should see the 3D virtual office with your messages!

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Input Layer   │────▶│   OpenClaw AI    │────▶│   Office UI     │
│  (Telegram/WA)  │     │   (Processing)   │     │  (Visualization)│
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                       │                        │
        │                       ▼                        │
        │              ┌──────────────────┐              │
        └─────────────▶│  Collaboration   │◀─────────────┘
                       │     Space        │
                       └──────────────────┘
```

## Components

1. **Input Layer** - Telegram/WhatsApp integration via OpenClaw
2. **Office UI** - 3D visualization of AI freelancers at desks (React Three Fiber)
3. **Collaboration Space** - Chat interface where you work with AI on deliverables
4. **SSE Proxy** - Real-time message streaming from OpenClaw to the UI

## Services

| Service | URL | Description |
|---------|-----|-------------|
| Virtual Office | http://localhost:5173 | 3D office visualization |
| OpenClaw Dashboard | http://localhost:18789 | AI gateway management |
| SSE Proxy | http://localhost:3001 | Real-time message streaming |

## Key Concepts

- **Freelancers, not Agents**: AI assistants are framed as freelancers you hire, not technical agents
- **Trust Levels**: Freelancers earn authority over time (apprentice → junior → senior)
- **Approval Layer**: Critical actions require human approval before execution
- **Voice-First**: Non-technical users can interact via voice messages

## Useful Commands

```bash
# View Docker logs
docker compose logs -f

# Stop the UI
docker compose down

# Restart OpenClaw
openclaw gateway restart

# Check OpenClaw status
openclaw doctor
```

## Tech Stack

- **Frontend**: React, React Three Fiber, Zustand
- **AI Gateway**: OpenClaw
- **Messaging**: Telegram Bot API
- **Streaming**: Server-Sent Events (SSE)

## License

MIT
