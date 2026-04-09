FROM node:20-bookworm

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 4010

CMD ["node", "server/orchestrator/server.mjs"]
