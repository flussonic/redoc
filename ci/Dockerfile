FROM ubuntu:20.04 as build
ENV DEBIAN_FRONTEND noninteractive

RUN apt update && apt -y install curl
RUN curl -sL https://deb.nodesource.com/setup_16.x | bash -
RUN curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" > /etc/apt/sources.list.d/yarn.list

RUN apt update \
    && apt -y install \
        nodejs build-essential yarn git

# компонент
WORKDIR redoc
COPY package.json .
COPY package-lock.json .
RUN npm install

COPY tsconfig.json .
COPY tsconfig.lib.json .
COPY webpack.config.ts .
COPY custom.d.ts .
COPY typings/styled-patch.d.ts typings/styled-patch.d.ts
COPY config config

COPY src src
COPY cli cli
COPY ci ci
COPY Makefile Makefile

# build
RUN npm run bundle:lib
RUN npm run bundle:standalone

# cli
RUN npm --prefix ./cli ci ./cli
RUN npm run compile:cli
