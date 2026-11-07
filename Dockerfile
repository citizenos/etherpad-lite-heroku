# Modernized Etherpad Heroku Wrapper Dockerfile
FROM node:24-alpine

# Install system dependencies
RUN apk add --no-cache \
    git \
    bash \
    make \
    python3 \
    g++ \
    curl

# Install pnpm
RUN npm install -g pnpm@latest

WORKDIR /app

# Copy workspace and wrapper configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml start.cjs ./
COPY config/ ./config/
COPY scripts/ ./scripts/
COPY custom/ ./custom/
COPY plugins/ ./plugins/

# Copy the etherpad-lite submodule contents
COPY etherpad-lite/ ./etherpad-lite/

# Install all dependencies (root and workspace packages)
RUN pnpm install

# Build Etherpad UI and pre-install bundled CitizenOS plugins + custom styles
RUN pnpm run build:ui && node scripts/install-plugins.cjs

ENV ETHERPAD_ALLOW_ROOT=true

# Etherpad usually runs on 9001, but Heroku sets $PORT
EXPOSE 9001

# Entrypoint is our start.cjs wrapper
CMD ["node", "start.cjs"]