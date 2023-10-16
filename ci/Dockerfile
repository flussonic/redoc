FROM ubuntu:20.04 as build
ENV DEBIAN_FRONTEND noninteractive

RUN apt update && apt -y install curl
RUN curl -sL https://deb.nodesource.com/setup_16.x | bash -
RUN curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" > /etc/apt/sources.list.d/yarn.list

RUN apt update \
    && apt -y install \
        nodejs build-essential yarn git

RUN node --version
RUN npm --version

# компонент
WORKDIR redoc
COPY package.json .
COPY .yarnrc.yml .
COPY yarn.lock .
RUN yarn set version 3.1.1
RUN yarn install

COPY tsconfig.json .
COPY .npmignore .
COPY tsconfig.lib.json .
COPY webpack.config.ts .
COPY custom.d.ts .
COPY typings/styled-patch.d.ts typings/styled-patch.d.ts
COPY config config

COPY src src
COPY cli cli
COPY Makefile Makefile

# cli
RUN npm --prefix ./cli i ./cli

# build
RUN yarn run bundle
