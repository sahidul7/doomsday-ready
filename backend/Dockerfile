FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
ENV PORT=3001 DB_FILE=/data/doomsday.db
VOLUME /data
EXPOSE 3001
CMD ["node", "src/server.js"]
