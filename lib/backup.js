'use strict';
const fs = require('fs');
const zlib = require('zlib');
const config = require('../config');
const mkdirp = require('mkdirp');
const path = require('path');
exports.start = start;

/**
 * [start description]
 * @param  {[type]} file [description]
 * @param  {[type]} type [description]
 * @return {[type]}      [description]
 */
function start(file, type) {
  if (type === 'file') {
    gzip(file);
  }
}

/**
 * [gzip description]
 * @param  {[type]} file [description]
 * @return {[type]}      [description]
 */
function gzip(file) {
  let backupFile = file.replace(config.logPath, config.backupPath) + '.gz';
  mkdirp.sync(path.dirname(backupFile));
  let writeStream = fs.createWriteStream(backupFile);
  writeStream.on('finish', function(err) {
    if (err) {
      console.error('[' + backupFile + ']生成备份文件失败, ' + err.message);
    }
  });
  fs.createReadStream(file).pipe(zlib.createGzip()).pipe(writeStream);
}
