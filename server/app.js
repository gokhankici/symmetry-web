var express    = require('express')
var bodyParser = require('body-parser')
var multer     = require('multer')

var app    = express()
var upload = multer() // for parsing multipart/form-data

app.use(bodyParser.json())                         // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

app.post('/', upload.array(), function (req, res, next) {
  res.json(req.body)
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
