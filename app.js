var server = require('./lib/server');
var jtLogger = require('jtlogger');
jtLogger.appPath = __dirname + '/';
jtLogger.add(jtLogger.transports.Console);
server.start();