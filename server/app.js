const express    = require('express')
const bodyParser = require('body-parser')
const multer     = require('multer')
const async      = require('async')
const _          = require('lodash')
const tmp        = require('tmp')
const winston    = require('winston')
const fs         = require('fs')
const path       = require('path')

// --- ROUTER ------------------------------------------------------------------

winston.add(winston.transports.File, { filename: 'server.log' })
winston.remove(winston.transports.Console)

const app    = express()
const upload = multer() // for parsing multipart/form-data

app.use(bodyParser.json())                         // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

// app.post can take a series of "middleware" functions
// next is the next handler
app.post('/', upload.array(), function (req, res, next) {
  checkPrologFile(req.body, res)
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})

// --- SERVER ------------------------------------------------------------------

function checkPrologFile(body, response) {
  async.waterfall([
    // initialize state & create the temporary folder
    async.apply(createTemporaryFolder, {body: body}),
    // create the prolog file
    writePrologFile,
    // create the response to the client
    createResponse
  ], (err, state) => {
    if (state.tmpdirCleanup) {
      // FIXME: uncomment the following line to delete the temporary folder
      // state.tmpdirCleanup()
    }

    if (err) {
      response.send("error: " + err)
    } else {
      response.send(JSON.stringify(state.response, null, 2) + "\n")
    }
  })
}

function createTemporaryFolder(state, callback) {
  tmp.dir({
    unsafeCleanup: true,
    keep:          true,
    template:      '/tmp/symmetry-web-XXXXXXXX'
  }, (err, path, cleanupCallback) => {
    if (err) {
      return callback(err)
    }
    _.assign(state, {tmpdir: path}, {tmpdirCleanup: cleanupCallback})
    callback(null, state)
  })
}

function writePrologFile(state, callback) {
  if(! (state && _.has(state, ['body', 'prologFile']))) {
    return callback('missing prolog file input')
  }

  const input    = state.body.prologFile
  const fileName = path.join(state.tmpdir, "symverify.pl")

  fs.writeFile(fileName, input, err => {
    if (err) {
      return callback(err)
    }
    callback(null, state)
  })
}

function createResponse(state, callback) {
  _.assign(state, {response: "done"})
  callback(null, state)
}
