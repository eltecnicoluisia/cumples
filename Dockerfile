# ==========================================
# ETAPA 1: Compilación de Frontend (React + Vite)
# ==========================================
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ==========================================
# ETAPA 2: Compilación de Backend (TypeScript + Prisma)
# ==========================================
FROM node:22-alpine AS backend-builder
WORKDIR /app/backend

COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm ci

COPY backend/ ./
RUN npx prisma generate
RUN npm run build

# ==========================================
# ETAPA 3: Imagen Final de Producción
# ==========================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV DATABASE_URL="file:/app/data/database.sqlite"

# Instalar dependencias esenciales de producción
COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm ci --omit=dev
RUN npx prisma generate

# Copiar artefactos compilados
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=frontend-builder /app/frontend/dist ./client-dist

# Crear directorios para persistencia de datos y subidas
RUN mkdir -p /app/data/uploads

# Exponer puerto HTTP
EXPOSE 4000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

# Comando de inicio
CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]
