# syntax=docker/dockerfile:1

# --- 1. Dépendances ----------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- 2. Build ----------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

# Marque à construire : "mahaza" (défaut) ou "stlouis".
# NEXT_PUBLIC_* est figée dans le bundle au build : l'ARG doit précéder `npm run build`.
ARG NEXT_PUBLIC_THEME=mahaza
ENV NEXT_PUBLIC_THEME=$NEXT_PUBLIC_THEME
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- 3. Runtime --------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 3000
CMD ["node", "server.js"]
