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
		write(buf);
	});
	server.bind(port, host);
	return server;
}


/**
 * [bindTCP description]
 * @param  {[type]} port [description]
 * @param  {[type]} host [description]
 * @return {[type]}      [description]
 */
function bindTCP(port, host) {
	const net = require('net');
	const server = net.createServer(function(c) { //'connection' listener
		console.info('client connected');
		/* istanbul ignore next */
		c.on('end', function() {
			console.info('client disconnected');
		});
		c.on('data', function(buf) {
			/* istanbul ignore if */
			if (!buf.length) {
				return;
			}
			let index = buf.indexOf(0);
			if (index === buf.length - 1) {
				write(buf.slice(0, index));
			} else {
				/* istanbul ignore if */
				if (buf[buf.length - 1] !== 0) {
					console.error('error');
				} else {
					let arr = splitBuffer(buf, 0);
					arr.forEach(write);
				}
			}
		});
	});
	server.listen(port, host, function() {
		console.info('server listening ' + host + ':' + port);
	});
	return server;
}

/**
 * [write description]
 * @param  {[type]} buf [description]
 * @return {[type]}     [description]
 */
function write(buf) {
	/* istanbul ignore if */
	if (buf[0] !== 0x7b || buf[buf.length - 1] !== 0x7d) {
		return;
	}
	let data;
	try {
		data = JSON.parse(buf.toString());
	} catch (err) {

	}
	/* istanbul ignore if */
	if (!data) {
		return;
	}
	_.forEach(transports, function(transport) {
		transport.write(data.app, data.log);
	});
}


/**
 * [splitBuffer description]
 * @param  {[type]} buf   [description]
 * @param  {[type]} value [description]
 * @return {[type]}       [description]
 */
function splitBuffer(buf, value) {
	let arr = [];
	let start = 0;
	let index = buf.indexOf(value, start);
	while (index !== -1) {
		arr.push(buf.slice(start, index));
		start = index + 1;
		index = buf.indexOf(value, start);
	}
	return arr;
}


exports.bindUDP = bindUDP;
exports.bindTCP = bindTCP;
exports.transports = {
	file: fileTransport
};
exports.addTransport = addTransport;
exports.removeTransport = removeTransport;