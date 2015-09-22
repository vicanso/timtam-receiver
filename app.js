'use strict';
const dgram = require("dgram");
const _ = require('lodash');
const fs = require('fs');
const server = dgram.createSocket("udp4");
const path = require('path');
const pkg = require('./package');
const jtlogger = require('jtlogger');
const config = require('./config');
if (config.env === 'production') {
  jtlogger.init([{
    timestamp: true
  }, {
    type: 'file',
    filename: path.join('/var/log', pkg.name, 'out.log'),
    timestamp: true
  }]);
}
const logger = require('./lib/logger');

if (config.env === 'production') {
  initLog();
}



server.on('error', function(err) {
  console.error(err);
});

server.on('message', function(buf, rinfo) {
  let data = JSON.parse(buf.toString());
  logger.write(data.tag, data.log);
});

server.on('listening', function() {
  let address = server.address();
  console.info('server listening ' + address.address + ':' + address.port);
});

server.bind(config.port);



/**
 * [initLog 初始化log]
 * @return {[type]} [description]
 */
function initLog() {
  const JTLogger = require('jtlogger');
  JTLogger.init([{
    type: 'file',
    filename: path.join('/var/log', pkg.name, 'out.log')
  }]);
}
