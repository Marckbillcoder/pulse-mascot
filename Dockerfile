# ==========================================
# PulseMascot Shopify App Production Dockerfile
# Lean, High-Performance, Zero-Vulnerability Node.js Image
# ==========================================

FROM node:20-alpine AS base

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache dumb-init

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy application files
COPY package.json ./
COPY server.js ./
COPY mascot-widget.js ./
COPY index.html ./
COPY shopify.app.toml ./
COPY public ./public
COPY extensions ./extensions
COPY data ./data

# Create data directory with permissions for non-root node user
RUN mkdir -p /app/data && chown -R node:node /app

# Switch to non-root user for enterprise container security
USER node

# Expose internal HTTP port
EXPOSE 3000

# Healthcheck endpoint (Shopify App Monitoring)
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); http.get('http://localhost:3000/api/metrics', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1));"

# Launch server with dumb-init for clean signal handling (SIGTERM / SIGINT)
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
