FROM ghcr.io/vessylapp/vessyl-docker-image:latest

LABEL org.opencontainers.image.source=https://github.com/vessylapp/vessyl-buildenv

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN curl -sSL https://nixpacks.com/install.sh | bash

CMD [ "npm", "run", "start" ]