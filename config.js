"use strict";
const pkg = require('./package');
const url = require('url');

exports.logPath = process.env.LOG_PATH || '/data/log';

exports.backupPath = process.env.BACKUP_PATH || '/data/log-backup';

exports.port = process.env.PORT || 6000;

exports.env = process.env.NODE_ENV || 'development';

exports.app = pkg.name;

exports.zmqPort = process.env.ZMQ_PORT || 6010;

exports.enableZmq = process.env.ZMQ !== 'disable';
