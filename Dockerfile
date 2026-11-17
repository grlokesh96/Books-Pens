# ============================================================
# Stage 1: Dependencies
# ============================================================
FROM node:24-alpine3.24 AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --prefer-offline --no-audit


# ============================================================
# Stage 2: Build
# ============================================================
FROM node:24-alpine3.24 AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./

COPY . .

RUN npm run build


# ============================================================
# Stage 3: Production
# ============================================================
FROM node:24-alpine3.24 AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]
