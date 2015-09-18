'use strict';
const dgram = require("dgram");
const server = dgram.createSocket("udp4");
const logger = require('./lib/logger');
const nameLength = 10;
server.on('error', function(err) {
  console.error(err);
});

server.on('message', function(buf, rinfo) {
  let data = JSON.parse(buf.toString());
  logger.write(data.tag, data.log)
});

server.on('listening', function() {
  let address = server.address();
  console.log('server listening ' + address.address + ':' + address.port);
});

server.bind(6000);
