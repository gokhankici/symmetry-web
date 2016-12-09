const express    = require('express')
const bodyParser = require('body-parser')
const multer     = require('multer')
const async      = require('async')
const _          = require('lodash')
const tmp        = require('tmp')
const winston    = require('winston')
const fs         = require('fs')
const path       = require('path')
const fsExtra    = require('fs-extra')
const execFile   = require('child_process').execFile;
const printf     = require('printf')

// --- ROUTER ------------------------------------------------------------------

winston.add(winston.transports.File, { filename: 'server.log' })
winston.remove(winston.transports.Console)

const app    = express()
const upload = multer() // for parsing multipart/form-data

const libraryFiles = [
  "rewrite.pl",
  "tags.pl",
  "lib/misc.pl"
]

const sicstusExe = "/usr/local/sicstus4.3.3/bin/sicstus"
const sicstusTimeout = 3 * 1000 // miliseconds

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
    // create the prolog file in the temporary folder
    writePrologFile,
    // copy library code to temporary folder
    copyLibrary,
    // call sicstus
    callSicstus
  ], (err, state) => {
    if (state & state.tmpdirCleanup) {
      // FIXME: uncomment the following line to delete the temporary folder
      // state.tmpdirCleanup()
    }

    if (err) {
      winston.error(err)
      response.send("error: " + err)
    } else {
      response.send(state.response)
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
      return callback(err, state)
    }
    _.assign(state, {tmpdir: path}, {tmpdirCleanup: cleanupCallback})
    callback(null, state)
  })
}

function writePrologFile(state, callback) {
  console.log(state)
  if(! (state && _.has(state, ['body', 'prologFile']))) {
    return callback('missing prolog file input', state)
  }

  const input    = state.body.prologFile
  const fileName = path.join(state.tmpdir, "symverify.pl")

  fs.writeFile(fileName, input, err => {
    if (err) {
      return callback(err, state)
    }
    callback(null, state)
  })
}

function copyLibrary(state, callback) {
  async.eachLimit(
    libraryFiles,
    1,
    (file, callback) => {
      const source = path.join("static", file)
      const target = path.join(state.tmpdir, file)
      fsExtra.copy(source, target, err => callback(err))
    },
    (err) => {
      callback(err, state)
    }
  )
}

// sicstus --noinfo --nologo --goal \"main,halt.\" -l symverify.pl
function callSicstus(state, callback) {
  const args = [
    "--noinfo", "--nologo",
    "--goal", "'main,halt.'",
    "-l", "symverify.pl"
  ]
  execFile(
    sicstusExe, args,
    {
      cwd:     state.tmpdir,
      timeout: sicstusTimeout
    },
    (error, stdout, stderr) => {
      const status   = error ? "ERROR" : "OK"
      const output   = error ? stderr  : stdout
      const response = printf("%s:\n%s", status, output)
      _.assign(state, {response: response})
      callback(null, state)
    }
  )
 }
