# -------- Build Stage --------
FROM node:24.11.0-alpine AS builder

WORKDIR /app

COPY . .
RUN npm ci

RUN npm run db:generate
RUN npm run build
# -------- Production Stage --------
FROM node:24.11.0-alpine AS production

# Create an unprivileged user
RUN addgroup -S nodegroup && adduser -S nodeuser -G nodegroup

WORKDIR /app

# Can be useful for debugging
RUN apk add nano
RUN apk add --no-cache curl

COPY .env ./
COPY .env.common ./
COPY prisma.config.ts ./
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/database-manager ./database-manager
COPY scripts/healthcheck.js ./scripts/

# Changing file ownership
RUN chown -R nodeuser:nodegroup /app

USER nodeuser

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node scripts/healthcheck.js

CMD ["node", "dist/src/main.js"]
