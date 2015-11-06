'use strict';
const assert = require('assert');
const receiver = require('../lib/receiver');


describe('receiver', function() {
	it('should collect log by udp successful', function(done) {
		let port = 6000;
		let udpServer = receiver.bindUDP(port);
		let transport = {
			write: function(app, log) {
				done();
				receiver.removeTransport(transport);
				udpServer.close();
			}
		}
		receiver.addTransport(transport);

		let dgram = require('dgram');
		let message = new Buffer(JSON.stringify({
			app: 'test',
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

	it('should collect log by tcp successful', function(done) {
		let port = 6000;
		let tcpServer = receiver.bindTCP(port);
		let times = 0;
		let transport = {
			write: function(app, log) {
				times++;
				if (times === 3) {
					done();
					receiver.removeTransport(transport);
					tcpServer.close();
				}
			}
		}
		receiver.addTransport(transport);

		let net = require('net');
		let options = {
			port: 6000,
			host: 'localhost'
		};
		let buf = new Buffer(JSON.stringify({
			app: 'test',
			log: {
				date: '2015-10-12',
				message: 'my message'
			}
		}));
		let endBuf = new Buffer(1);
		endBuf[0] = 0;
		let sendBuf = Buffer.concat([buf, endBuf]);
		let client = net.connect(options, function() { //'connect' listener
			console.log('connected to server!');
			client.write(sendBuf);
			setTimeout(function() {
				client.write(Buffer.concat([sendBuf, sendBuf]));
				client.end();
			}, 1000);

		});
	});
});