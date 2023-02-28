CONTAINER_NAME = orbitdb
VERSION = latest

build_container:
	docker build -t $(CONTAINER_NAME):${VERSION} .

run_container:
	docker run -d -p 8000:8000 -v $(PWD)/orbitdb:/usr/app/orbitdb -v $(PWD)/orbitdb-ipfs:/usr/app/orbitdb-ipfs $(CONTAINER_NAME)

run:
	make build_container
	make run_container