'use strict';
const path = require('path');
const mkdirp = require('mkdirp');
const moment = require('moment');
const _ = require('lodash');
const fs = require('fs');
const waitToCloseInterval = 30 * 1000;
const checkFileNameInterval = 10 * 1000;
const flushInterval = 5 * 1000;
const cacheMax = 20;
const backup = require('./backup');

class FileStream {
  constructor(logPath, tag) {
    this.logPath = logPath;
    this.tag = tag;
    this.file = moment().format('YYYY-MM-DD') + '.log';
    this.checkFileName();
    this.buf = [];
    this._waitToClose = _.debounce(() => this.close(), waitToCloseInterval);
    this._flush = _.debounce(() =>
      this.flush(), flushInterval);
  }

  checkFileName() {
    let file = moment().format('YYYY-MM-DD') + '.log';
    if (this.file !== file) {
      let oldFile = this.file;
      this.file = file;
      this.close();
      backup.start(path.join(this.logPath, this.tag, oldFile), 'file');
    }
    _.delay(() => this.checkFileName(), checkFileNameInterval);
  }
  close() {
    if (this.stream) {
      this.stream.end();
    }
    this.stream = null;
  }
  write(msg) {
    this.buf.push(msg + '\n');
    if (this.buf.length >= cacheMax) {
      this.flush();
    } else {
      this._flush();
    }
    this._waitToClose();
  }
  create() {
    if (!this.stream) {
      let logPath = path.join(this.logPath, this.tag);
      mkdirp.sync(logPath);
      let options = {
        flags: 'a+'
      };
      let file = path.join(logPath, this.file);
      this.stream = fs.createWriteStream(file, options);
    }
  }
  flush() {
    this.create();
    this.stream.write(this.buf.join(''));
    this.buf.length = 0;
  }
}

module.exports = FileStream;
