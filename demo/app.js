'use strict';
const receiver = require('..');
const path = require('path');
const timtamMongo = require('../../timtam-mongo');
const fileTransport = receiver.transports.file;

fileTransport.logPath = path.join(__dirname, 'logs');
receiver.addTransport(fileTransport);

timtamMongo.init('mongodb://localhost/timtam');
receiver.addTransport(timtamMongo);

receiver.bindUDP(6000);

// fileTransport.archive('test', '2015-11-06').then(function() {
// 	// body...
// }, function(err) {

// });

fileTransport.count('test', '2015-11-06').then(function(count) {
	console.dir(count);
}, function(err) {

});