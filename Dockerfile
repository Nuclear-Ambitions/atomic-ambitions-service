# Multi-stage build for production
FROM node:20-alpine AS builder

# Enable corepack to use pnpm
RUN corepack enable

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the TypeScript application (assumes 'build' script in package.json compiles to /dist)
RUN pnpm run build

# Production stage
FROM node:20-alpine AS production

# Enable corepack
RUN corepack enable

WORKDIR /app

# Copy built artifacts and node_modules from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Expose the port (adjust if your Fastify app uses a different port)
EXPOSE 3000

# Start the application (adjust the entry point if needed, e.g., dist/server.js)
CMD ["node", "dist/index.js"]
