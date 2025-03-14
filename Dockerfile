FROM node:23-slim

WORKDIR /question_3

COPY package.json ./

RUN npm i

COPY . .

EXPOSE 3000

CMD [ "node", "server.js" ]