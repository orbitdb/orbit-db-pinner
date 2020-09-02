clean:
	docker image prune --filter label=stage=orbit-db-pinner-builder

docker-build:
	docker build . -t orbit-db-pinner:latest

docker-run-dev:
	docker run orbit-db-pinner:latest
