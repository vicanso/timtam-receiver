'use strict';
const dgram = require('dgram');
const client = dgram.createSocket("udp4");

function log() {
  let str = '';
  for (var i = 0; i < 100; i++) {
    str += Math.random();
  }
  let message = new Buffer('  APP-NAME' + str + '\n');
  console.dir(message.length);
  client.send(message, 0, message.length, 2000, '127.0.0.1', function(
    err) {
    console.dir(err);
  });
}
// setInterval(function() {
//   log();
// }, 1000);

log();
