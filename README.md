# Timtam Logs Collector

Collecting logs by udp protocol and then call transport to handle log message.

Transport can save the logs to files, db and so on.



Send the logs to timtam server by [jtlogger](https://github.com/vicanso/jtlogger) .

## Installation

```bash
$ npm install timtam
```

### API

### addTransport

```js
const timtam = require('timtam');
const fileTransport = timtam.transport.file;
// log path, default is '/var/log'
fileTransport.logPath = '/data/log';
timtam.addTransport(fileTransport);
// add transport,
timtam.addTransport({
	write: function(tag, log) {

	}
});

timtam.bindUDP(6000);
```


### removeTransport

```js
const timtam = require('timtam');
timtam.addTransport(fileTransport);

setTimeout(function() {
	timtam.removeTransport(fileTransport);
}, 1000);
```

### bindUDP

```js
const timtam = require('timtam');
timtam.bindUDP(6000);
```

### bindTCP

```js
const timtam = require('timtam');
timtam.bindTCP(6000);
```

## License

MIT
