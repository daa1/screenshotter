var http = require('http');
var url  = require('url');
var spawn = require('child_process').spawn;
var AWS = require('aws-sdk');
var fs = require("fs");

http.createServer(function (req, res) {
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
      //var imageData = fs.readFileSync('images/'+image_name, "base64");
      AWS.config.loadFromPath('./config.json');
      // Set your region for future requests.
      AWS.config.update({region: 'us-east-1'});

      fs.readFile('images/'+image_name, function (err, data) {
        var params = {Bucket: 'screenshotter-bucket', Key: image_name, Body: data};
          var s3 = new AWS.S3();
          s3.client.putObject(params, function(err, data) {
            if (err)
            console.log(err)
          else
            console.log("Successfully uploaded data to screenshotter-bucket/"+image_name);
        });
      });

      /*
      var params = {Bucket: 'screenshotter-bucket', Key: image_name, Body: imageData};
      s3.client.putObject(params, function(err, data) {
        if (err)
          console.log(err)
        else
          console.log("Successfully uploaded data to screenshotter-bucket/"+image_name);
      });
      */
      res.writeHead(200, {"Content-Type": "application/json"});
      res.write(
        JSON.stringify({ 
          grabbedUrl: url_to_grab, 
          imageName: image_name
        })
      );
      res.end();
  	});
  }
  
}).listen(1337, '127.0.0.1');
console.log('Server running at http://127.0.0.1:1337/');