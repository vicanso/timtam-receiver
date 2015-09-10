'use strict';
const dgram = require('dgram');
const client = dgram.createSocket("udp4");

setInterval(function() {
  let message = new Buffer('  APP-NAME' + Math.random() + '\n');
  client.send(message, 0, message.length, 2000, '127.0.0.1', function(
    argument) {
    // body...
  });
}, 1000);
