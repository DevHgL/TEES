# syntax=docker/dockerfile:1

# ---------- 1. deps: todas as dependências (inclusive de desenvolvimento) ----------
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# --ignore-scripts: o postinstall (prisma generate) roda no estágio de build, com o schema.
RUN npm ci --ignore-scripts

# ---------- 2. build: gera o Prisma Client e compila o TypeScript ----------
FROM deps AS build
COPY tsconfig.json tsconfig.build.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src
RUN npm run build

# ---------- 3. migrate: aplica as migrations e roda o seed (usado pelo docker compose) ----------
FROM build AS migrate
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed"]

# ---------- 4. prod-deps: só as dependências de produção ----------
# --legacy-peer-deps: o @prisma/client declara o CLI do Prisma (e o TypeScript) como peer;
# o client já é gerado e compilado em dist/, então o CLI não precisa ir para a imagem final.
FROM node:24-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --legacy-peer-deps --ignore-scripts && npm cache clean --force

# ---------- 5. runtime: imagem final enxuta, sem TypeScript nem ferramentas de build ----------
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000

COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
COPY --chown=node:node public ./public

# Não roda como root dentro do container.
USER node
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" || exit 1

CMD ["node", "dist/main/server.js"]
