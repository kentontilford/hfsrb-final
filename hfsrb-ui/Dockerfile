# Multi-stage not strictly necessary; keep it simple and reliable for Playwright
FROM node:20-bookworm-slim

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_BASE_URL=http://localhost:3000

WORKDIR /app

# Install system deps for Playwright Chromium (fonts and libs)
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates wget gnupg \
      libnss3 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxdamage1 libxext6 libxfixes3 \
      libxrandr2 libatk1.0-0 libatk-bridge2.0-0 libdrm2 libgtk-3-0 libgbm1 libpango-1.0-0 libcairo2 \
      libasound2 fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Enable pnpm and install deps
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm i --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm build \
    && npx playwright install chromium --with-deps

EXPOSE 3000

CMD ["pnpm", "start"]

