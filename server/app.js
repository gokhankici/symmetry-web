const express         = require('express')
const exphbs          = require('express-handlebars')
const bodyParser      = require('body-parser')
const multer          = require('multer')
const checkPrologFile = require('./backend')
const logger          = require('./log')
const printf          = require('printf')
const _               = require('lodash')


// --- ROUTER ------------------------------------------------------------------

const port = 8082

const app    = express()
const upload = multer() // for parsing multipart/form-data

app.use(bodyParser.json())                         // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(express.static("static"))
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// app.post can take a series of "middleware" functions
// next is the next handler
app.get('/', (req, res) => {
    res.render('home', {})
})

app.post('/', upload.array(), function (req, res, next) {
  if(! _.has(req, ['body', 'prologFile'])) {
    return res.send('missing prolog file input')
  }

  checkPrologFile(
    req.body.prologFile,
    (err, responseValue) => {
      if (err) {
        logger.error(err)
        res.send("error: " + err)
      } else {
        res.send(responseValue)
      }
    }
  )
});

app.post('/test', upload.array(), (req, res, next) => {
  if(! _.has(req, ['body', 'file1']) || ! _.has(req, ['body', 'file2'])) {
    return res.send('missing prolog file input(s)')
  }
  res.send(req.body.file1 + "\n" + req.body.file2)
})

app.listen(port, function () {
  console.log(printf('symmetry web server listening on port %d ...', port))
})
