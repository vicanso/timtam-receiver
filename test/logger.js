'use strict';
const assert = require('assert');
const logger = require('../lib/logger');


describe('logger', function() {
  it('should collect log by udp successful', function(done) {
    let udpPort = 6000;
    let udpServer = logger.bindUDP(udpPort);
    let transport = {
      write: function(tag, log) {
        done();
        logger.removeTransport(transport);
        udpServer.close();
      }
    }
    logger.addTransport(transport);



    let dgram = require('dgram');
    let message = new Buffer(JSON.stringify({
      tag: 'test',
      log: {
        date: '2015-10-12',
        message: 'my message'
      }
    }));
    var client = dgram.createSocket("udp4");
    client.send(message, 0, message.length, udpPort, "localhost", function(err) {
      client.close();
    });

  });
});
