var net = require('net');
var client = net.connect({
		port: 7001
	},
	function() { //'connect' listener
		console.log('connected to server!');
		client.write('+timtam0\r\n');
		client.write('+timtam1\r\n');
		client.write('+timtam2\r\n');
		client.write('+timtam3\r\n');
		// setTimeout(function() {
		// 	client.write('-timtam');
		// }, 5000);
	});
client.on('data', function(data) {
	console.dir(data.length);
	console.log(data.toString());
	// client.end();
});
client.on('end', function() {
	console.log('disconnected from server');
});