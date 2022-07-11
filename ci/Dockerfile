FROM ubuntu:20.04 as build
ENV DEBIAN_FRONTEND noninteractive

ARG PUBLIC_URL

RUN apt update && apt -y install curl
RUN curl -sL https://deb.nodesource.com/setup_16.x | bash -
RUN curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" > /etc/apt/sources.list.d/yarn.list

RUN apt update \
    && apt -y install \
        nodejs build-essential yarn git

# компонент
WORKDIR redoc
ADD package.json .
ADD yarn.lock .
RUN yarn install --force

ADD tsconfig.json .
ADD tsconfig.lib.json .
ADD webpack.config.ts .
ADD tslint.json .
ADD .eslintrc.js .
ADD custom.d.ts .

ADD src src
ADD cli cli
ADD ci ci
RUN yarn bundle

ARG NPM_TOKEN
ARG VERSION
RUN npm config set @flussonic:registry https://git.erlyvideo.ru/api/v4/projects/311/packages/npm/
RUN npm config set -- '//git.erlyvideo.ru/api/v4/projects/296/packages/npm/:_authToken' "${NPM_TOKEN}"
RUN sed -i 's/  "version".*/  "version": "'${VERSION}'",/g' package.json
