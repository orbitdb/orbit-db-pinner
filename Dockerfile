FROM alpine:20200626 as builder
LABEL stage=orbit-db-pinner-builder

RUN apk add --no-cache nodejs npm python3 alpine-sdk

WORKDIR /usr/src/app

COPY ./package.json .

ENV NODE_ENV=production
RUN npm install -g pnpm
RUN pnpm install

FROM alpine:20200626


RUN apk add --no-cache nodejs

WORKDIR /usr/src/app

COPY ./config ./config
COPY ./lib ./lib
COPY ./package.json .
COPY ./pinner.js .

COPY --from=builder /usr/src/app/node_modules ./node_modules

ENTRYPOINT node pinner.js
