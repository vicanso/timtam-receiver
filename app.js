var server = require('./lib/server');
var jtLogger = require('jtlogger');
jtLogger.appPath = __dirname + '/';
var address = process.env.address || '127.0.0.1:2900';

server.start(address);