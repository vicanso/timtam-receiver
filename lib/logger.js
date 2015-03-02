var streamDict = {};
var fs = require('fs');
var FileStream = require('./file_stream');
var filter = require('./filter');
var path = require('path');
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
    var filePath = path.join(config.logPath, tag);
    stream = new FileStream(filePath);
    streamDict[tag] = stream;
  }
  stream.write(msg);
};