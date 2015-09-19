'use strict';
const dgram = require("dgram");
const _ = require('lodash');
const fs = require('fs');
const server = dgram.createSocket("udp4");
const path = require('path');
const logger = require('./lib/logger');
const pkg = require('./package');
const config = require('./config');
const ConsulClient = require('consul-simple-client');
const co = require('co');
if (config.env === 'production') {
  initLog();
  co(function*() {
    yield register();
  }).catch(function(err) {
    console.error(err);
  });
}



server.on('error', function(err) {
  console.error(err);
});

server.on('message', function(buf, rinfo) {
  let data = JSON.parse(buf.toString());
  logger.write(data.tag, data.log);
});

server.on('listening', function() {
  let address = server.address();
  console.info('server listening ' + address.address + ':' + address.port);
});

server.bind(config.port);



/**
 * [initLog 初始化log]
 * @return {[type]} [description]
 */
function initLog() {
  const JTLogger = require('jtlogger');
  JTLogger.init([{
    type: 'file',
    filename: path.join('/var/log', pkg.name, 'out.log')
  }]);
}


/**
 * [register 注册服务]
 * @return {[type]} [description]
 */
function* register() {
  let consulInfo = config.consul;
  console.dir(consulInfo);
  let consul = new ConsulClient({
    host: consulInfo.hostname,
    port: consulInfo.port
  });

  let hostName = process.env.HOSTNAME;
  let hosts = fs.readFileSync('/etc/hosts', 'utf8');
  // etc hosts中的ip都是正常的，因此正则的匹配考虑的简单一些
  let reg = new RegExp('((?:[0-9]{1,3}\.){3}[0-9]{1,3})\\s*' + hostName);
  let address = _.get(reg.exec(hosts), 1);
  if (!address) {
    throw new Error('can not get address');
  }
  let tags = ['udp-log', config.env];
  yield consul.register({
    id: hostName,
    service: config.app,
    address: address,
    port: config.port,
    tags: _.uniq(tags)
  });
}
