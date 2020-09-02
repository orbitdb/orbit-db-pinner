docker-build:
	docker build . -t orbit-db-pinner:latest
	docker image prune --filter label=stage=orbit-db-pinner-builder

docker-run-dev:
	docker run orbit-db-pinner:latest
