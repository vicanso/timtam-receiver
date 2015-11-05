'use strict';
const assert = require('assert');
const receiver = require('../lib/receiver');


describe('receiver', function() {
	it('should collect log by udp successful', function(done) {
		let port = 6000;
		let udpServer = receiver.bindUDP(port);
		let tcpServer = receiver.bindTCP(port);
		let transport = {
			write: function(tag, log) {
				done();
				receiver.removeTransport(transport);
				udpServer.close();
				tcpServer.close();
			}
		}
		receiver.addTransport(transport);



		let dgram = require('dgram');
		let message = new Buffer(JSON.stringify({
			tag: 'test',
			log: {
				date: '2015-10-12',
				message: 'my message'
			}
		}));
		var client = dgram.createSocket("udp4");
		client.send(message, 0, message.length, port, "localhost", function(err) {
			client.close();
		});

	});
});