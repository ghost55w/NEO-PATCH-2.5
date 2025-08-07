FROM node:20-bullseye-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
  git \
  && rm -rf /var/lib/apt/lists/*

RUN git clone https://github.com/Ainz-fo/NEO-BOT-MD.git /app

WORKDIR /app

RUN npm install

EXPOSE 8000

CMD ["npm", "start"]
