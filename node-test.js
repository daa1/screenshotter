var http = require('http');
var url  = require('url');
var spawn = require('child_process').spawn;

http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
  var url_parts = url.parse(req.url, true);
  var url_to_grab = url_parts.query.url;
  var image_name = url_parts.query.imgurl;
  
  
  if(image_name !== undefined && url_to_grab !== undefined) {
  	console.log("url to grab: " + url_to_grab + " image name: " + image_name);
    screenshotter = spawn('phantomjs', ['screenshotter.js', url_to_grab, 'images/'+image_name]);

    screenshotter.stdout.on('data', function (data) {
	  console.log('stdout: ' + data);
	});

	screenshotter.stderr.on('data', function (data) {
	  console.log('stderr: ' + data);
	});

	screenshotter.on('exit', function (code) {
	  console.log('child process exited with code ' + code);
	});
  }
  
}).listen(1337, '127.0.0.1');
console.log('Server running at http://127.0.0.1:1337/');