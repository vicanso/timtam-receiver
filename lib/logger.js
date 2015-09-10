'use strict';
var streamDict = {};
const FileStream = require('./file-stream');
const path = require('path');
const config = require('../config');

/**
 * [write 写消息]
 * @param  {[type]} tag [description]
 * @param  {[type]} msg [description]
 * @return {[type]}     [description]
 */
exports.write = function(tag, msg) {
  let stream = streamDict[tag];
  if (!stream) {
    let filePath = path.join(config.logPath, tag);
    stream = new FileStream(filePath);
    streamDict[tag] = stream;
  }
  stream.write(msg);
};
