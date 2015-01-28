var streamDict = {};
var fs = require('fs');
var FileStream = require('./file_stream');
var config = require('../config');

/**
 * [write 写消息]
 * @param  {[type]} tag [description]
 * @param  {[type]} msg [description]
 * @return {[type]}     [description]
 */
exports.write = function(tag, msg){
  var stream = streamDict[tag];
  if(!stream){
    var appConfig = config[tag];
    if(!appConfig){
      throw new Error(tag + '\'s config is null');
    }
    if(!appConfig.path){
      throw new Error(tag + 'is not defined log path');
    }
    stream = new FileStream(appConfig.path);
    streamDict[tag] = stream;
  }
  stream.write(msg);
};