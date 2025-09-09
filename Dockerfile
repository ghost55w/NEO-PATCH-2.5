FROM node:20-alpine

RUN apk add --no-cache git bash

RUN git clone https://github.com/Ainz-fo/NEO-BOT-MD.git /ovl_bot

WORKDIR /ovl_bot

RUN npm install

EXPOSE 8000

CMD ["npm", "start"]
