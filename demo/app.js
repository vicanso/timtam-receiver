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