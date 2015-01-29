var dgram = require('dgram');
var server = dgram.createSocket('udp4');
var _ = require('lodash');
var logger = require('./logger');
var config = require('../config');
var zmq = require('zmq');
var udpAddress = getAddress(process.env.udp || '127.0.0.1:2900');
var zmqAddress = getAddress(process.env.zmq || '127.0.0.1:2910');

function getAddress(address){
  var arr = address.split(':');

  var host = arr[0];
  var port = parseInt(arr[1]);
  return {
    host : host,
    port : port
  };
}

function getLogTag(msg){
  var logTag = '';
  var result = _.find(config, function(v, tag){
    if(!logTag && v.filter(msg)){
      logTag = tag;
    }
  });
  return logTag;
};

function getZmqSocket(){
  var host = zmqAddress.host;
  var port = zmqAddress.port;
  var sock = zmq.socket('pub');
  sock.bindSync('tcp://' + host + ':' + port);
  console.log('Publisher bound to %s:%s', host, port);
  return sock;
};

exports.start = function(){
  var zmqSocket;
  try{
    zmqSocket = getZmqSocket();
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
      console.dir(tag);
      zmqSocket.send([tag, msg]);
    }
  });

  server.bind(udpAddress.port, udpAddress.host);
};