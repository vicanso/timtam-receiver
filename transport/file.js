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
		this.buf = [];
		this._waitToClose = _.debounce(this.close.bind(this), options.waitToCloseInterval);
		this._flush = _.debounce(this.flush.bind(this), options.flushInterval);
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
			FileStream.archive(options.app, oldFile);
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
			let logPath = path.join(options.logPath, options.app);
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

	/**
	 * [count description]
	 * @param  {[type]} app        [description]
	 * @param  {[type]} date       [description]
	 * @param  {[type]} conditions [description]
	 * @return {[type]}            [description]
	 */
	static count(app, date, conditions) {
		return new Promise(function(resolve, reject) {
			getReadLineFile(app, date).then(function(file) {
				const readline = require('linebyline');
				let r = readline(file);
				let count = 0;
				let validate = getValidate(conditions);

				r.on('end', function() {
					resolve(count);
				});
				r.on('line', function(str) {
					if (!validate) {
						count++;
					} else {
						let data = JSON.parse(str);
						if (validate(data)) {
							count++;
						}
					}
				});
				r.on('error', reject);
			}, reject);
		});
	}

	static archive(app, filename) {
		if (!app && !date) {
			throw new Error('app and filename can both be null');
		}
		let file = app;
		if (filename) {
			file = path.join(exports.logPath, app, filename);
		}
		return new Promise(function(resolve, reject) {
			let readStream = fs.createReadStream(file);
			let writeStream = fs.createWriteStream(file + '.gz');
			let gzip = zlib.createGzip();
			readStream.pipe(gzip).pipe(writeStream);
			writeStream.on('finish', resolve);
			writeStream.on('error', reject);
		});
	}
}


function getReadLineFile(app, date) {
	let file = path.join(exports.logPath, app, date + '.log');
	return new Promise(function(resolve, reject) {
		fs.stat(file, function(err) {
			if (!err) {
				return resolve(file);
			}
			file += '.gz';
			fs.stat(file, function(err) {
				if (!err) {
					return resolve(fs.createReadStream(file).pipe(zlib.createGunzip()));
				}
				reject(err);
			});
		});
	});
}

function getValidate(conditions) {
	if (!conditions) {
		return;
	}
	let beginDate = _.get(conditions, 'date.$gte', date + 'T00:00:00.000Z');
	let endDate = _.get(conditions, 'date.$lte', date + 'T24:00:00.000Z');
	let reg = conditions.reg;
	return function(data) {
		let date = data.date;
		let message = data.message;
		if (date < beginDate || date > endDate) {
			return false;
		} else if (reg) {
			return new RegExp(reg, 'i').test(message);
		}
		return true;
	};
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
		let keys = 'cacheMax logPath waitToCloseInterval checkFileNameInterval flushInterval'.split(' ');
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

exports.archive = FileStream.archive;

exports.count = FileStream.count;