'use strict';
var streamDict = {};

const FileStream = require('./file-stream');
const path = require('path');
const config = require('../config');
const socket = initSocket();

/**
 * [write 写消息]
 * @param  {[type]} tag [description]
 * @param  {[type]} msg [description]
 * @return {[type]}     [description]
 */
exports.write = function(tag, msg) {
  if (!tag) {
    return;
  }
  let stream = streamDict[tag];
  if (!stream) {
    stream = new FileStream(config.logPath, tag);
    streamDict[tag] = stream;
  }
  stream.write(msg);
  if (socket) {
    socket.send([tag, msg]);
  }
};

/**
 * [initSock description]
 * @return {[type]} [description]
 */
function initSocket() {
  if (process.env.ZMQ === 'disable') {
    return;
  }
  let zmq = require('zmq');
  let sock = zmq.socket('pub');
  let url = 'tcp://0.0.0.0:' + config.zmqPort;
  sock.bindSync(url);
  console.info('zmq bind %s', url);
  return sock;
}
