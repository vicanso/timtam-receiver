"use strict";
const pkg = require('./package');
const program = require('commander');
const url = require('url');
const _ = require('lodash');

function convertPort(v, defaultValue) {
  if (v) {
    return parseInt(v);
  } else {
    return defaultValue;
  }
}

function list(v, defaultValue) {
  return (v || defaultValue).split(',');
}

program
  .version(pkg.version)
  .option('-l, --logPath <path>', 'log path', '/data/log')
  .option('-p, --port <n>', 'udp port', convertPort, 6000)
  .option('--ports <items>', 'udp port list', list, '6000,6001')
  .option('--zmq <n>', 'zmq port', convertPort, 6010)
  .parse(process.argv);

_.forEach('logPath port zmq ports'.split(' '), function(name) {
  exports[name] = program[name];
});

exports.app = pkg.name;
exports.enableZmq = false;

// console.log(' size: %j', program.size);
// console.log(' drink: %j', program.drink);

console.dir(exports);

// exports.logPath = process.env.LOG_PATH || '/data/log';
//
// exports.backupPath = process.env.BACKUP_PATH || '/data/log-backup';
//
// exports.port = process.env.PORT || 6000;
//
// exports.env = process.env.NODE_ENV || 'development';
//
// exports.app = pkg.name;
//
// exports.zmqPort = process.env.ZMQ_PORT || 6010;
//
// exports.enableZmq = process.env.ZMQ !== 'disable';
