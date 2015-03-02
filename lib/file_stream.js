var path = require('path');
var mkdirp = require('mkdirp');
var fs = require('fs');
var _ = require('lodash');
var debug = require('debug')('jt.log_server');


function FileStream(logPath){
  this.logPath = logPath;
  this.file = this._getDate();
  this._waitToClose();
  this.checkFileName();
  debug('save log to:%s', logPath);
}

var fn = FileStream.prototype;


/**
 * [_getDate 获取日期（YYYY-MM-DD）]
 * @return {[type]} [description]
 */
fn._getDate = function(){
  var date = new Date();
  var str = date.getFullYear();

  str += '-';
  var month = date.getMonth() + 1;
  if(month < 10){
    str += ('0' + month);
  }else{
    str += month;
  }

  str += '-';
  var day = date.getDate();
  if(day < 10){
    str += ('0' + day);
  }else{
    str += day;
  }
  return str;
};

/**
 * [close 关闭stream]
 * @return {[type]} [description]
 */
fn.close = function(){
  this.stream.end();
  this.stream = null;
};

/**
 * [_waitToClose 在30秒之内没有再次调用，则关闭stream]
 * @return {[type]} [description]
 */
fn._waitToClose = _.debounce(function(){
  this.close();
}, 30 * 1000);

/**
 * [write 写消息]
 * @param  {[type]} msg [description]
 * @return {[type]}     [description]
 */
fn.write = function(msg){
  this.create();
  this.stream.write(msg);
  this._waitToClose();
};

/**
 * [create 创建stream]
 * @return {[type]} [description]
 */
fn.create = function(){
  if(!this.stream){
    var logPath = this.logPath;
    mkdirp.sync(logPath);
    var options = {
      flags : 'a+'
    };
    var file = path.join(logPath, this.file + '.log');
    this.stream = fs.createWriteStream(file, options);
  }
  return this.stream;
};


/**
 * [checkFileName 检查文件名是否需要修改（因为log文件是按日期来分割，所以要定时判断是否需要创建新的stream）]
 * @return {[type]} [description]
 */
fn.checkFileName = function(){
  var self = this;
  var date = this._getDate();
  if(this.file !== date){
    this.file = date;
    this.close();
  }
  _.delay(function(){
    self.checkFileName();
  }, 10 * 1000);
};

module.exports = FileStream;
