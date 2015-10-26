'use strict';
const assert = require('assert');
const fileTransport = require('../transport/file');
const path = require('path');
const fs = require('fs');
const moment = require('moment');
const mkdirp = require('mkdirp');
const del = require('del');
describe('file transport', function() {
  var appName = 'test-app';
  var logPath = path.join(__dirname, '../logs');
  let logFile = path.join(logPath, appName, moment().format('YYYY-MM-DD') + '.log');

  fileTransport.logPath = logPath;

  // 删除log文件
  function removeLogFile() {
    del.sync(logPath);
  }

  removeLogFile();

  it('should write log to file successful', function(done) {
    let logMessage = 'test message';
    fileTransport.cacheMax = 2;
    fileTransport.write(appName, logMessage);
    fileTransport.write(appName, logMessage);
    fileTransport.close(appName);
    fs.readFile(logFile, 'utf-8', function(err, text) {
      removeLogFile();
      if (err) {
        done(err);
      } else {
        assert.equal(text, logMessage + '\n' + logMessage + '\n');
        done();
      }
    });
  });
});
