install:
	npm install

run-debug:
	DEBUG="page-loader:*" npm run babel-node -- ./bin/page_loader.js $(1)

run:
	npm run babel-node -- ./bin/page_loader.js $(1)

test:
	npm run test

test-debug:
	DEBUG="page-loader:*" npm run test

build:
	rm -rf dist
	npm run build

.PHONY: test
