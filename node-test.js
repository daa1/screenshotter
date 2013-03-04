var http = require('http');
var url  = require('url');
var spawn = require('child_process').spawn;
var AWS = require('aws-sdk');
var fs = require("fs");
var querystring = require('querystring');

http.createServer(function (req, res) {
  req.on('data', function(data) {
    var queryData = JSON.parse(data.toString('utf-8'));
    //console.log(data.toString('utf-8'));
    for(q in queryData) {
      var screenToShoot = queryData[q];
      console.log(screenToShoot);

      startScreenshotProcess(screenToShoot.pageUrl, screenToShoot.imageName)
    }
  });
  
  res.writeHead(200, {"Content-Type": "application/json"});
  res.write(
    JSON.stringify({ 
      status: "ok"
    })
  );
  res.end();
  
}).listen(1337, '127.0.0.1');
console.log('Server running at http://127.0.0.1:1337/');

var startScreenshotProcess = function(url_to_grab, image_name) {
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
      uplooadToS3(image_name);
    });
  }
}

var uplooadToS3 = function(image_name) {
  AWS.config.loadFromPath('./config.json');
  // Set region for future requests.
  AWS.config.update({region: 'us-east-1'});
  fs.readFile('images/'+image_name, function (err, data) {
    var params = {Bucket: 'screenshotter-bucket', Key: image_name, Body: data};
    var s3 = new AWS.S3();
    s3.client.putObject(params, function(err, data) {
      if (err) {
        console.log(err)  
      }
      else {
        console.log("Successfully uploaded data to screenshotter-bucket/"+image_name);
      }
    });
  });
}