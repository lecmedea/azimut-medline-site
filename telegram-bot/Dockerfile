FROM node:20-alpine
WORKDIR /app
COPY package.json ./
COPY bot.js ./
COPY assets ./assets
# .env is NOT copied — set env vars in the host (Render/Railway)
ENV NODE_ENV=production
CMD ["node", "bot.js"]
