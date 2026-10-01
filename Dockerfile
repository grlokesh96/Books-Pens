# -----------------------------
# Builder stage
# -----------------------------
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files and install all dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source and build
COPY . .
RUN npm run build

# -----------------------------
# Runtime stage
# -----------------------------
FROM node:24-alpine AS runner

WORKDIR /app

# Copy the production build and installed node_modules from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

EXPOSE 3000

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]
