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
                       │  (lastui.com)    │
                       └──────────────────┘
```

## Components

1. **Input Layer** - Telegram/WhatsApp integration via OpenClaw
2. **Office UI** - Isometric game-like visualization of AI freelancers at desks
3. **Collaboration Space** - Video-call style interface where you work with AI on deliverables
4. **Memory Layer** - Persistent context for each freelancer

## Setup

### Prerequisites
- Node.js >= 22
- OpenClaw CLI installed

### Installation

```bash
# Install OpenClaw globally
npm install -g openclaw@latest

# Run the onboarding wizard
openclaw onboard --install-daemon

# Configure Telegram (get token from @BotFather)
# Add TELEGRAM_BOT_TOKEN to ~/.openclaw/.env

# Start the gateway
openclaw gateway
```

### Project Setup

```bash
cd virtual-office
npm install
npm run dev
```

## Key Concepts

- **Freelancers, not Agents**: AI assistants are framed as freelancers you hire, not technical agents
- **Trust Levels**: Freelancers earn authority over time (apprentice → junior → senior)
- **Approval Layer**: Critical actions require human approval before execution
- **Voice-First**: Non-technical users can interact via voice messages

## Milestones

- **M1**: Telegram input → OpenClaw processing → response
- **M2**: Office UI with draggable freelancers at desks
- **M3**: Collaboration space with video-call style interface
- **M4**: Full integration and routing between freelancers

