module.exports = checkPrologFile

const async      = require('async')
const _          = require('lodash')
const tmp        = require('tmp')
const fs         = require('fs')
const path       = require('path')
const fsExtra    = require('fs-extra')
const execFile   = require('child_process').execFile;
const printf     = require('printf')

const libraryFiles = [
  "rewrite.pl",
  "tags.pl",
  "lib/misc.pl"
]

const sicstusExe     = "/usr/local/sicstus4.3.3/bin/sicstus"
const sicstusTimeout = 3 * 1000 // miliseconds

function checkPrologFile(file, callback) {
  async.waterfall([
    // initialize state & create the temporary folder
    async.apply(createTemporaryFolder, {file: file}),
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
    callback(err, state.response)
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
  const input    = state.file
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
    (fileName, callback) => {
      const source = path.join("prolog", fileName)
      const target = path.join(state.tmpdir, fileName)
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
