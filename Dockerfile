FROM node:20-alpine
WORKDIR /app
# Enables HSTS in server.js and disables dev-only behavior
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
RUN mkdir -p data
EXPOSE 3000
CMD ["node", "src/server.js"]
