var dgram = require('dgram');
var server = dgram.createSocket('udp4');
var _ = require('lodash');
var logger = require('./logger');
var filter = require('./filter');
var zmq = require('zmq');
var env = process.env.NODE_ENV || 'development';
var debug = require('debug')('jt.log_server');

function getLogTag(msg){
  var logTag = '';
  _.forEach(filter, function(v, tag){
    if(!logTag && v.filter && v.filter(msg)){
      logTag = tag;
    }
  });
  if(!logTag){
    var reg = /\[([\S\s]+?)\]/;
    var result = reg.exec(msg);
    if(result && result.length === 2){
      logTag = result[1];
    }
  }
  return logTag;
}

function getZmqSocket(zmqAddress){
  var host = zmqAddress.host;
  var port = zmqAddress.port;
  var sock = zmq.socket('pub');
  sock.bindSync('tcp://' + host + ':' + port);
  console.log('Publisher bound to %s:%s', host, port);
  return sock;
}

function getServers(cbf){
  var request = require('request');
  if(env !== 'development'){
    request.get('http://jt-service.oss-cn-shenzhen.aliyuncs.com/server.json', function(err, res, data){
      try{
        data = JSON.parse(data);
      }catch(err){
        cbf(err);
        return;
      }
      cbf(null, data);
    });
  }else{
    cbf(null, {
      log : {
        host : 'localhost',
        port : 2900
      },
      zmq : {
        host : '127.0.0.1',
        port : 2910
      }
    });
  }
}

exports.start = function(){
  getServers(function(err, serverList){
    if(err){
      console.error(err);
      return;
    }
    debug('serverList:%j', serverList);
    var zmqSocket;
    try{
      zmqSocket = getZmqSocket(serverList.zmq);
    }catch(e){
      console.error(e);
    }
    server.on('listening', function(){
      var address = server.address();
      console.log('UDP server listening on %s:%s', address.address, address.port);
    });

    server.on('message', function(msg){
      msg = msg.toString();
      var tag = getLogTag(msg);
      debug('tag: , msg:', tag, msg);
      logger.write(tag, msg.trim() + '\n');
      if(zmqSocket){
        zmqSocket.send([tag, msg]);
      }
    });
    var logServer = serverList.log;
    server.bind(logServer.port, logServer.host);
  });
  
};