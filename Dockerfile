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

# Copy the etherpad-lite submodule contents
# Note: In a real Git environment, this clones the submodule.
# Here we copy the local state of the submodule.
COPY etherpad-lite/ ./etherpad-lite/

# Install all dependencies (root and workspace packages)
RUN pnpm install

# Build Etherpad UI
RUN cd etherpad-lite/src && pnpm run build:ui

# Etherpad usually runs on 9001, but Heroku sets $PORT
EXPOSE 9001

# Entrypoint is our start.cjs wrapper
CMD ["node", "start.cjs"]