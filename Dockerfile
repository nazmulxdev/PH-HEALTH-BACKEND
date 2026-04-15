FROM node:22-alpine

WORKDIR /app

ARG DATABASE_URL

ENV DATABASE_URL=${DATABASE_URL}

COPY package.json package-lock.json ./

RUN npm ci 

COPY . .

RUN npm run build

EXPOSE 5000

CMD [ "node","/api/server.js" ]

