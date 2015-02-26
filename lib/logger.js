var streamDict = {};
var fs = require('fs');
var FileStream = require('./file_stream');
var config = require('../config');
var path = require('path');

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
    var filePath;
    if(appConfig && appConfig.path){
      filePath = appConfig.path;
    }else{
      filePath = path.join(config.base.path, tag);
    }
    stream = new FileStream(filePath);
    streamDict[tag] = stream;
  }
  stream.write(msg);
};