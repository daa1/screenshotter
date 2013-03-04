var http = require('http');
var url  = require('url');
var spawn = require('child_process').spawn;
var AWS = require('aws-sdk');
var fs = require("fs");
var querystring = require('querystring');
//var sys = require('util');
//var counter = 0;

http.createServer(function (req, res) {
  //sys.puts('Counter ' + counter + " from " + req.url);

  if (req.url === '/favicon.ico') {
    res.writeHead(200, {'Content-Type': 'image/x-icon'} );
    res.end();
    console.log('favicon requested');
    return;
  }

  AWS.config.loadFromPath('./config.json');
  // Set region for future requests.
  AWS.config.update({region: 'us-east-1'});
  req.on('data', function(data) {
    var queryData = JSON.parse(data.toString('utf-8'));
    //console.log(data.toString('utf-8'));
    for(q in queryData) {
      var screenToShoot = queryData[q];
      console.log(screenToShoot);

      startScreenshotProcess(screenToShoot.pageUrl, screenToShoot.imageName)
    }
  });
  
  var keyCollection = [];
  var s3 = new AWS.S3();
  s3.client.listObjects({ Bucket : 'screenshotter-bucket' }, function(err, data){
    if (err) throw err;
    for(c in data.Contents) {
      console.log(data.Contents[c].Key);
      keyCollection.push({"fileName": data.Contents[c].Key});
    }
    res.writeHead(200, {"Content-Type": "application/json"});
    res.write(
      JSON.stringify({ 
        images: keyCollection
      })
    );
    res.end();
  }); 
}).listen(1337, '127.0.0.1');
console.log('Server running at http://127.0.0.1:1337/');

var startScreenshotProcess = function(urlToGrab, imageName) {
  if(imageName !== undefined && urlToGrab !== undefined) {
    console.log("url to grab: " + urlToGrab + " image name: " + imageName);
    screenshotter = spawn('phantomjs', ['screenshotter.js', urlToGrab, 'images/'+imageName]);

    screenshotter.stdout.on('data', function (data) {
      console.log('stdout: ' + data);
    });

    screenshotter.stderr.on('data', function (data) {
      console.log('stderr: ' + data);
    });

    screenshotter.on('exit', function (code) {
      console.log('child process exited with code ' + code);
      uplooadToS3(imageName);
    });
  }
}

var uplooadToS3 = function(imageName) {
  fs.readFile('images/'+imageName, function (err, data) {
    var params = {Bucket: 'screenshotter-bucket', Key: imageName, Body: data};
    var s3 = new AWS.S3();
    s3.client.putObject(params, function(err, data) {
      if (err) {
        console.log(err)  
      }
      else {
        console.log("Successfully uploaded data to screenshotter-bucket/"+imageName);
      }
    });
  });
}