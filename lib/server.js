var dgram = require('dgram');
var server = dgram.createSocket('udp4');
var _ = require('lodash');
var logger = require('./logger');
var config = require('../config');
var zmq = require('zmq');

var getLogTag = function(msg){
  var logTag = '';
  var result = _.find(config, function(v, tag){
    if(!logTag && v.filter(msg)){
      logTag = tag;
    }
  });
  return logTag;
};

var getZmqSocket = function(port, host){
  if(!port){
    throw new Error('port can no be null');
  }
  host = host || '127.0.0.1';
  var sock = zmq.socket('pub');
  sock.bindSync('tcp://' + host + ':' + port);
  console.log('Publisher bound to %s:%s', host, port);
  return sock;
};

exports.start = function(address){
  if(!address){
    throw new Error('address can no be null');
  }
  var arr = address.split(':');

  var host = arr[0];
  var port = parseInt(arr[1]);
  var zmqSocket;
  try{
    zmqSocket = getZmqSocket(port + 1, host);
  }catch(e){
    console.error(e);
  }
  server.on('listening', function(){
    var address = server.address();
    console.log('haproxy, UDP server listening on %s:%s', address.address, address.port);
  });

  server.on('message', function(msg){
    msg = msg.toString();
    var tag = getLogTag(msg);
    logger.write(tag, msg);
    if(zmqSocket){
      zmqSocket.send([tag, msg]);
    }
  });

  server.bind(port, host);
};