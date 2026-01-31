# MoneyChat Virtual Office
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better caching)
COPY virtual-office/package*.json ./virtual-office/
RUN cd virtual-office && npm install

# Copy application code
COPY virtual-office/ ./virtual-office/

# Copy OpenClaw config template (will be overwritten by volume mount if needed)
COPY openclaw-config/ /root/.openclaw/

# Expose ports
# 5173 - Vite dev server
# 3001 - SSE proxy
EXPOSE 5173 3001

# Start both the proxy and the dev server
WORKDIR /app/virtual-office
CMD ["sh", "-c", "node proxy.cjs & npm run dev -- --host"]
