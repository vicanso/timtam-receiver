'use strict';
const spawn = require('child_process').spawn;
const path = require('path');
const execFile = path.join(__dirname, 'app.js');
console.dir(execFile);

const cmd = spawn('node', [execFile]);

cmd.stdout.on('data', function (data) {
  console.info(data.toString());
});

cmd.stderr.on('data', function (data) {
  console.error(data.toString());
});

cmd.on('close', function (code) {
  console.info('child_process exited with code ' + code);
});

// var spawn = require('child_process').spawn,
//     ls    = spawn('ls', ['-lh', '/usr']);
//
// ls.stdout.on('data', function (data) {
//   console.log('stdout: ' + data);
// });
//
// ls.stderr.on('data', function (data) {
//   console.log('stderr: ' + data);
// });
//
// ls.on('close', function (code) {
//   console.log('child process exited with code ' + code);
// });
