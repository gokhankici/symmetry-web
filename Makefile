all:
	@echo "available options: install, server"

.PHONY: install server

install:
	npm install

server:
	node server/app.js
