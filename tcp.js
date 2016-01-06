'use strict';
const net = require('net');
const _ = require('lodash');
const EventEmitter = require('events');

class Client {
	constructor(options) {
		options = _.extend({
			port: 7001,
			host: '127.0.0.1'
		}, options)
		this._connect(options);
		this._bufRest = null;
		this._subTags = [];
		this.emiter = new EventEmitter();
	}
	sub(tag) {
		if (_.indexOf(this._subTags, tag) === -1) {
			this.client.write('+' + tag);
			this._subTags.push(tag);
		}
		return this;
	}
	unsub(tag) {
		const index = _.indexOf(this._subTags, tag);
		if (index !== -1) {
			this._subTags.splice(index, 1);
			this.client.write('-' + tag);
		}
		return this;
	}
	on(event, listener) {
		this.emiter.on(event, listener);
		return this;
	}
	once(event, listener) {
		this.emiter.once(event, listener);
		return this;
	}
	removeListener(event, listener) {
		this.emiter.removeListener(event, listener);
		return this;
	}
	removeAllListeners(event) {
		this.emiter.removeAllListeners(event);
		return this;
	}
	_handleBuffer(buf) {
		let index = 0;
		let divideIndex = -1;
		const emiter = this.emiter;
		if (this._bufRest) {
			buf = Buffer.concat([this._bufRest, buf]);
			this._bufRest = null;
		}
		while (divideIndex = buf.indexOf(0, index)) {
			if (divideIndex === -1) {
				break;
			}
			const str = buf.toString('utf8', index, divideIndex);
			const arr = str.split('\t');
			const topic = arr[0];
			if (topic === 'LOG-TAGS') {
				let tagInfos = _.map(arr[1].split(','), (str) => {
					let arr = str.split('|');
					return {
						name: arr[0],
						createdAt: parseInt(arr[1]),
						count: parseInt(arr[2])
					};
				});
				emiter.emit('tags', tagInfos);
			} else {
				emiter.emit('data', topic, arr[1]);
			}

			index = divideIndex + 1;
		}
		if (index !== buf.length) {
			this._bufRest = buf.slice(index);
		}
		return this;
	}
	_connect(options, isReconnect) {
		const client = net.connect({
			port: options.port,
			host: options.host
		});
		client.on('data', buf => {
			this._handleBuffer(buf);
		});
		client.on('error', (err) => {
			if (err.code === 'ECONNREFUSED') {
				setTimeout(() => {
					this._connect(options, true);
				}, 5000);
			}
			console.error(err);
		});
		client.on('end', () => {
			setTimeout(() => {
				this._connect(options, true);
			}, 5000);
		});
		isReconnect && client.on('connect', () => {
			_.forEach(this._subTags, (tag) => {
				client.write('+' + tag);
			});
		});
		this.client = client;
	}
}

module.exports = Client;

const client = new Client();
client.sub('timtam');
client.sub('timtam');
client.on('data', (topic, msg) => {
	// console.dir(topic);
	// console.dir(msg);
	// client.unsub('timtam');
});
client.on('tags', (tags) => {
	console.dir(tags);
});