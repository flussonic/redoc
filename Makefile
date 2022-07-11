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
		--build-arg VERSION=$(VERSION) \
		--build-arg NPM_TOKEN=$(NPM_TOKEN) \
		--build-arg PKG_VERSION=$(VERSION) \
		--build-arg PUBLIC_URL=/dist/redoc/${CI_COMMIT_REF_SLUG}/${CI_COMMIT_SHORT_SHA}/ \
		--tag ${CI_REGISTRY}/redoc/src-${CI_COMMIT_REF_SLUG}:latest .

build-extract:
	rm -rf output
	CONTAINER=$$(docker create ${CI_REGISTRY}/redoc/src-${CI_COMMIT_REF_SLUG}:latest) ; \
	docker cp $${CONTAINER}:/redoc/example/build build ;\
	docker rm -f $${CONTAINER}

npm-upload:
	docker run --init --rm ${CI_REGISTRY}/redoc/src-${CI_COMMIT_REF_SLUG}:latest npm publish
