'use strict';
const transports = [];
const _ = require('lodash');
const fileTransport = require('../transport/file');


/**
 * [addTransport description]
 * @param {[type]} transport [description]
 */
function addTransport(transport) {
	if (_.indexOf(transports, transport) === -1) {
		transports.push(transport);
	}
}

/**
 * [removeTransport description]
 * @param  {[type]} transport [description]
 * @return {[type]}           [description]
 */
function removeTransport(transport) {
	transports.splice(_.indexOf(transports, transport), 1);
}

/**
 * [bindUDP description]
 * @param  {[type]} port [description]
 * @param  {[type]} host [description]
 * @return {[type]}      [description]
 */
function bindUDP(port, host) {
	const dgram = require("dgram");
	const server = dgram.createSocket("udp4");
	/* istanbul ignore next */
	server.on('error', function(err) {
		console.error(err);
	});
	server.on('listening', function() {
		let address = server.address();
		console.info('server listening ' + address.address + ':' + address.port);
	});
	server.on('message', function(buf) {
		let msg = buf.toString();
		if (msg.charAt(0) === '{' && msg.charAt(msg.length - 1) === '}') {
			let data = JSON.parse(msg);
			write(data.tag, data.log);
		} else {
			console.error(msg)
		}
	});
	server.bind(port, host);
	return server;
}

/**
 * [write description]
 * @param  {[type]} tag [description]
 * @param  {[type]} log [description]
 * @return {[type]}     [description]
 */
function write(tag, log) {
	_.forEach(transports, function(transport) {
		transport.write(tag, log);
	});
}

exports.bindUDP = bindUDP;
exports.transports = {
	file: fileTransport
};
exports.addTransport = addTransport;
exports.removeTransport = removeTransport;