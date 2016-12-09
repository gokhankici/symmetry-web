const winston = require('winston')

winston.add(winston.transports.File, { filename: 'server.log', maxsize: 10000000, maxFiles: 3 })
winston.remove(winston.transports.Console)

module.exports = winston
