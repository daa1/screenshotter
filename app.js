
/**
 * Module dependencies.
 */

var express = require('express')
  , fs = require('fs')
  , spawn = require('child_process').spawn
  , AWS = require('aws-sdk');


AWS.config.loadFromPath('./config.json');
// Set region for future requests.
AWS.config.update({region: 'us-east-1'});

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes
app.get('/', function (req, res){
  res.render('index', { title: 'Express' })
});

app.get('/form', function (req, res) {
  res.render('form', { title: 'Form' })
}); 

app.get('/test', function(req, res) {
  fs.readFile('./request.html', function(error, content) {
  	if(error) {
  		res.writeHead(500);
  		res.end();
  	}
  	else {
  		res.writeHead(200, { 'Content-Type': 'text/html' });
  		res.end(content, 'utf-8');
  	}
  });
});

app.get('/list', function(req, res) {
  var keyCollection = [];
  var s3 = new AWS.S3();
  s3.client.listObjects({ Bucket : 'screenshotter-bucket' }, function(err, data){
    if (err) throw err;
    for(c in data.Contents) {
      console.log(data.Contents[c].Key);
      keyCollection.push({"fileName": data.Contents[c].Key});
    }
    res.json(keyCollection);
  }); 
})

app.post('/start', function(req, res) {
  var queryData = req.body;
  for(q in queryData) {
    var screenToShoot = queryData[q];
    console.log(screenToShoot);

    startScreenshotProcess(screenToShoot.pageUrl, screenToShoot.imageName)
  }
  res.json(req.body);
});

var startScreenshotProcess = function(urlToGrab, imageName) {
  if(imageName !== undefined && urlToGrab !== undefined) {
    console.log("url to grab: " + urlToGrab + " image name: " + imageName);
    screenshotter = spawn('phantomjs', ['./lib/screenshotter.js', urlToGrab, 'images/'+imageName]);

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

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);