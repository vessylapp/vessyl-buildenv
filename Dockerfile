FROM ubuntu:22.04

LABEL org.opencontainers.image.source=https://github.com/vessylapp/vessyl-buildenv
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    apt-transport-https \
    lsb-release \
    gnupg \
    git \
    wget

RUN curl -sL https://deb.nodesource.com/setup_lts.x | bash -
RUN apt-get install -y nodejs npm
RUN install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc && \
    chmod a+r /etc/apt/keyrings/docker.asc && \
    echo "deb [signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list && \
    apt-get update && \
    apt-get install -y docker-ce docker-ce-cli containerd.io

RUN node -v
RUN npm -v

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN curl -sSL https://nixpacks.com/install.sh | bash

CMD [ "npm", "run", "start" ]