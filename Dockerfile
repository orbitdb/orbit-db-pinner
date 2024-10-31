# syntax=docker/dockerfile:1

FROM node:20.17 AS build-env
ENV NODE_ENV=production

WORKDIR /app
COPY ["package.json", "package-lock.json*", "./"]
RUN npm ci --only=production
COPY . .

FROM node:20.17-slim
COPY --from=build-env /app /app
WORKDIR /app
CMD [ "node", "./src/bin/cli.js", "daemon" ]
