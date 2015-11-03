'use strict';
const path = require('path');
const mkdirp = require('mkdirp');
const moment = require('moment');
const _ = require('lodash');
const fs = require('fs');
const streamDict = {};

class FileStream {
  /**
   * @param  {[type]}
   * @return {[type]}
   */
  constructor(options) {
    this.options = options;
    this.file = moment().format('YYYY-MM-DD') + '.log';
    this.checkFileName();
    this.buf = [];
    this._waitToClose = _.debounce(this.close.bind(this), options.waitToCloseInterval);
    this._flush = _.debounce(this.flush.bind(this), options.flushInterval);
  }

  /**
   * @return {[type]}
   */
  checkFileName() {
    let options = this.options;
    let file = moment().format('YYYY-MM-DD') + '.log';
    /* istanbul ignore if */
    if (this.file !== file) {
      let oldFile = this.file;
      this.file = file;
      this.close();
    }
    let timer = _.delay(this.checkFileName.bind(this), options.checkFileNameInterval);
    timer.unref();
  }

  /**
   * @return {[type]}
   */
  close() {
    if (this.stream) {
      this.flush();
      this.stream.end();
    }
    this.stream = null;
  }

  /**
   * @param  {[type]}
   * @return {[type]}
   */
  write(msg) {
    let options = this.options;
    this.buf.push(msg + '\n');
    if (this.buf.length >= options.cacheMax) {
      this.flush();
    } else {
      this._flush();
    }
    this._waitToClose();
  }

  /**
   * @return {[type]}
   */
  create() {
    if (!this.stream) {
      let options = this.options;
      let logPath = path.join(options.logPath, options.tag);
      mkdirp.sync(logPath);
      let streamOptions = {
        flags: 'a+'
      };
      let file = path.join(logPath, this.file);
      this.stream = fs.createWriteStream(file, streamOptions);
    }
  }

  /**
   * @return {[type]}
   */
  flush() {
    if (this.buf.length) {
      this.create();
      this.stream.write(this.buf.join(''));
      this.buf.length = 0;
    }
  }

  /**
   * [destroy description]
   * @return {[type]} [description]
   */
  destroy() {
    this._waitToClose.cancel();
    this._flush.cancel();
    this.close();
  }
}



/**
 * @param  {[type]}
 * @param  {[type]}
 * @return {[type]}
 */
function write(tag, msg) {
  /* istanbul ignore if */
  if (!tag || !msg) {
    return;
  }
  let stream = streamDict[tag];
  if (!stream) {
    let keys = 'cacheMax logPath waitToCloseInterval checkFileNameInterval flushInterval'.split(' ');
    let options = _.pick(exports, keys);
    options.tag = tag;
    stream = new FileStream(options);
    streamDict[tag] = stream;
  }
  if(_.isObject(msg)){
    msg = JSON.stringify(msg);
  }
  stream.write(msg);
}

/**
 * @param  {[type]}
 * @return {[type]}
 */
function close(tag) {
  /* istanbul ignore if */
  if (!tag || !streamDict[tag]) {
    return;
  }
  let stream = streamDict[tag];
  delete streamDict[tag];
  stream.destroy();
}

// 日志目录
exports.logPath = '/var/log';
// 写日志函数
exports.write = write;
// 日志保存多少条才写文件（避免频繁写文件）
exports.cacheMax = 20;
// 等待多久无日志写入则关闭stream
exports.waitToCloseInterval = 30 * 1000;
// 检查日志文件名称间隔（日志文件根据YYYY-MM-DD来生成）
exports.checkFileNameInterval = 10 * 1000;
// 多长时间无日志再写入时，flush缓存日志到文件
exports.flushInterval = 5 * 1000;
// 关闭日志写入流
exports.close = close;
