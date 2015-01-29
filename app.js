var server = require('./lib/server');
var jtLogger = require('jtlogger');
jtLogger.appPath = __dirname + '/';

server.start();