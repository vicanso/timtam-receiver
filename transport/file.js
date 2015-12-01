'use strict';
const path = require('path');
const mkdirp = require('mkdirp');
const _ = require('lodash');
const fs = require('fs');
const zlib = require('zlib');
const streamDict = {};

class FileStream {
	/**
	 * @param  {[type]}
	 * @return {[type]}
	 */
	constructor(options) {
		this.options = options;
		this.file = this._getFileName();
		this.checkFileName();
	}

	/**
	 * @return {[type]}
	 */
	checkFileName() {
		let options = this.options;
		let file = this._getFileName();
		/* istanbul ignore if */
		if (this.file !== file) {
			this.close();
			let oldFile = this.file;
			this.file = file;
		}
		let timer = _.delay(this.checkFileName.bind(this), options.checkFileNameInterval);
		timer.unref();
	}

	/**
	 * [_getFileName description]
	 * @return {[type]} [description]
	 */
	_getFileName() {
		let str = (new Date()).toISOString();
		return str.substring(0, 10) + '.log';
	}

	/**
	 * @return {[type]}
	 */
	close(cb) {
		if (this.stream) {
			this.stream.end(cb);
		}
		this.stream = null;
	}

	/**
	 * @param  {[type]}
	 * @return {[type]}
	 */
	write(msg) {
		this.create();
		this.stream.write(msg + '\n');
	}

	/**
	 * @return {[type]}
	 */
	create() {
		if (!this.stream) {
			let options = this.options;
			let logPath = path.join(options.logPath, options.app);
			mkdirp.sync(logPath);
			let streamOptions = {
				flags: 'a'
			};
			let file = path.join(logPath, this.file);
			this.stream = fs.createWriteStream(file, streamOptions);
		}
	}

	/**
	 * [destroy description]
	 * @param  {Function} cb [description]
	 * @return {[type]}      [description]
	 */
	destroy(cb) {
		this.close(cb);
	}
}



/**
 * @param  {[type]}
 * @param  {[type]}
 * @return {[type]}
 */
function write(app, msg) {
	/* istanbul ignore if */
	if (!app || !msg) {
		return;
	}
	let stream = streamDict[app];
	if (!stream) {
		let keys = 'logPath waitToCloseInterval checkFileNameInterval'.split(' ');
		let options = _.pick(exports, keys);
		options.app = app;
		stream = new FileStream(options);
		streamDict[app] = stream;
	}
	if (_.isObject(msg)) {
		msg = JSON.stringify(msg);
	}
	stream.write(msg);
}

/**
 * @param  {[type]}
 * @return {[type]}
 */
function close(tag, cb) {
	/* istanbul ignore if */
	if (!tag || !streamDict[tag]) {
		return;
	}
	let stream = streamDict[tag];
	delete streamDict[tag];
	stream.destroy(cb);
}

// 日志目录
exports.logPath = '/var/log';
// 写日志函数
exports.write = write;
// 等待多久无日志写入则关闭stream
exports.waitToCloseInterval = 30 * 1000;
// 检查日志文件名称间隔（日志文件根据YYYY-MM-DD来生成）
exports.checkFileNameInterval = 10 * 1000;
// 关闭日志写入流
exports.close = close;