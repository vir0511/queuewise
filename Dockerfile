FROM node:22-alpine

ARG GIT_SHA=local
ENV NODE_ENV=production
ENV GIT_SHA=$GIT_SHA

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY app.js server.js ./
COPY views ./views
COPY public ./public
COPY data ./data

RUN chown -R node:node /app
USER node

EXPOSE 3000
CMD ["node", "server.js"]
