const pkg = require('./package');
const url = require('url');

exports.logPath = process.env.LOG_PATH || '/data/log';

exports.backupPath = process.env.BACKUP_PATH || '/data/log-backup';

exports.port = process.env.PORT || 6000;

exports.env = process.env.NODE_ENV || 'development';

exports.app = pkg.name;

exports.consul = url.parse(process.env.CONSUL || 'http://127.0.0.1:8500');

exports.zmq = process.env.ZMQ;
