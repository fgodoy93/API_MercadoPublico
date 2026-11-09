# Etapa 1: Compilar el Frontend (Vue 3 + Vite + Tailwind)
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Etapa 2: Servidor de Producción (Node.js + Express + Sequelize)
FROM node:20-alpine
WORKDIR /app

# Instalar dependencias del Backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# Copiar código del Backend
COPY backend/ ./backend/

# Copiar el Frontend compilado desde la Etapa 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

WORKDIR /app/backend
CMD ["node", "src/server.js"]
