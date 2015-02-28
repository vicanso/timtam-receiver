var streamDict = {};
var fs = require('fs');
var FileStream = require('./file_stream');
var filter = require('./filter');
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
    var config = filter[tag];
    var filePath;
    if(config && config.path){
      filePath = config.path;
    }else{
      filePath = path.join(filter.base.path, tag);
    }
    stream = new FileStream(filePath);
    streamDict[tag] = stream;
  }
  stream.write(msg);
};