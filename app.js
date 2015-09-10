'use strict';
const dgram = require("dgram");
const server = dgram.createSocket("udp4");
const logger = require('./lib/logger');
const nameLength = 10;
server.on('error', function(err) {
  console.error(err);
});

server.on('message', function(buf, rinfo) {
  let name = buf.toString('utf8', 0, nameLength).trim();
  let msg = buf.toString('utf8', nameLength);
  logger.write(name, msg)
});

server.on('listening', function() {
  let address = server.address();
  console.log('server listening ' + address.address + ':' + address.port);
});

server.bind(2000);
