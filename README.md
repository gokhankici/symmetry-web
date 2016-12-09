# Installation

1. Download latest [npm](https://nodejs.org/en/) and add the `bin` folder to the
`PATH` environment variable

2. Execute `npm install` to download the packages

# Running the server

```sh
cd server
node app.js
```
You can use `curl` for testing:

```sh
curl -H "Content-Type: application/json" -X POST -d '{"prologFile": <file_input>}' localhost:3000
```
