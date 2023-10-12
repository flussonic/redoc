ifeq (,${CI_COMMIT_REF_SLUG})
  CI_COMMIT_REF_SLUG ?= $(shell git rev-parse --abbrev-ref HEAD | sed 's/\//-/')
endif

ifeq (,${CI_COMMIT_SHORT_SHA})
  CI_COMMIT_SHORT_SHA ?= $(shell git rev-parse --short HEAD)
endif

VERSION ?= $(shell git describe --abbrev=7 --long | sed 's/^v//g')
ifneq (,$(TAG))
  VERSION=$(shell echo ${TAG} | sed 's/^v//')
endif

BRANCH := $(shell git rev-parse --abbrev-ref HEAD)

HTTP_BRANCH=$(shell echo ${BRANCH}| sed 's/\//-/')

CI_REGISTRY ?= registry.erlyvideo.ru:443

build:
	docker build \
		-f ci/Dockerfile \
		--tag ${CI_REGISTRY}/redoc/src-${HTTP_BRANCH}:latest .

npm-upload:
	docker run --init --rm ${CI_REGISTRY}/redoc/src-${HTTP_BRANCH}:latest npm publish

ci_publish_npm_gitlab:
	docker run --rm -e GITLAB_NPM_AUTH_TOKEN -e VERSION=${VERSION} -e CI_PROJECT_ID ${CI_REGISTRY}/redoc/src-${HTTP_BRANCH}:latest make npm_publish_gitlab

ci_publish_npm_gitlab_cli:
	docker run --rm -e GITLAB_NPM_AUTH_TOKEN -e VERSION=${VERSION} -e CI_PROJECT_ID ${CI_REGISTRY}/redoc/src-${HTTP_BRANCH}:latest make npm_publish_gitlab_cli

npm_publish_public:
	echo "//registry.npmjs.org/:_authToken=${NPM_AUTH_TOKEN}" > .npmrc
	npm publish --access public

npm_publish_gitlab:
	npm config set @web:registry https://git.erlyvideo.ru/api/v4/projects/${CI_PROJECT_ID}/packages/npm/
	npm config set -- '//git.erlyvideo.ru/api/v4/projects/${CI_PROJECT_ID}/packages/npm/:_authToken' "${GITLAB_NPM_AUTH_TOKEN}"
	npm publish

npm_publish_gitlab_cli:
	npm config set @web:registry https://git.erlyvideo.ru/api/v4/projects/${CI_PROJECT_ID}/packages/npm/
	npm config set -- '//git.erlyvideo.ru/api/v4/projects/${CI_PROJECT_ID}/packages/npm/:_authToken' "${GITLAB_NPM_AUTH_TOKEN}"
	cd cli;
	npm publish
