'use strict';
const dgram = require("dgram");
const server = dgram.createSocket("udp4");
const path = require('path');
const logger = require('./lib/logger');
const pkg = require('./package');

server.on('error', function(err) {
  console.error(err);
});

server.on('message', function(buf, rinfo) {
  let data = JSON.parse(buf.toString());
  logger.write(data.tag, data.log)
});

server.on('listening', function() {
  let address = server.address();
  console.info('server listening ' + address.address + ':' + address.port);
});

server.bind(6000);



/**
 * [initLog 初始化log]
 * @return {[type]} [description]
 */
function initLog() {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }
  const JTLogger = require('jtlogger');
  JTLogger.init([{
    type: 'file',
    filename: path.join('/var/log', pkg.name, 'out.log')
  }]);
}
