'use strict';
const spawn = require('child_process').spawn;
const path = require('path');
const execFile = path.join(__dirname, 'app.js');
const config = require('./config');
const _ = require('lodash');

_.forEach(config.ports, function(port) {
  let args = [execFile].concat(process.argv.slice(2));
  args.push('-p', port);
  run(args)
});


function run(args) {
  let cmd = spawn('node', args);

  cmd.stdout.on('data', function(data) {
    console.info(data.toString());
  });

  cmd.stderr.on('data', function(data) {
    console.error(data.toString());
  });

  cmd.on('close', function(code) {
    console.info('child_process exited with code ' + code);
    run(args);
  });
}
