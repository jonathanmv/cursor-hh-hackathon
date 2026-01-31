# MoneyChat Virtual Office - Production Build
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better caching)
COPY virtual-office/package*.json ./
RUN npm install

# Copy application code
COPY virtual-office/ ./

# Build the frontend for production
RUN npm run build

# Create sessions directory for OpenClaw integration
RUN mkdir -p /data/sessions

# Environment variables (override these at runtime)
ENV PORT=3001
ENV SESSIONS_DIR=/data/sessions
ENV BASE_URL=http://localhost:3001
# TELEGRAM_BOT_TOKEN must be set at runtime
# VITE_OPENAI_API_KEY can be set at build time for frontend

# Expose single port (proxy serves both API and static files)
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/ || exit 1

# Start the server
CMD ["node", "proxy.cjs"]
