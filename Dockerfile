# Stage 1: Build
FROM node:20-alpine AS builder

# Required for Prisma to run on Alpine
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Install dependencies
COPY package*.json ./
# npm ci is faster and more reliable than npm install
RUN npm ci

# Provide a dummy DATABASE_URL for build-time Prisma validation
ENV DATABASE_URL="file:/app/prisma/dev.db"
ARG DATABASE_URL="file:/app/prisma/dev.db"

# Copy source and prisma
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Stage 2: Runner
FROM node:20-alpine AS runner

# Required in runner for Prisma engines
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

ENV NODE_ENV=production

# Copy necessary files from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Expose port
EXPOSE 3000

# Start the application
# Note: In production, we run migrations before starting
CMD npx prisma migrate deploy && npm start
