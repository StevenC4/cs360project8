var DATA_DIR = "data";

var MongoClient = require('mongodb').MongoClient;
var express = require('express');
var bodyParser = require('body-parser');
var https = require('https');
var http = require('http');
var fs = require('fs');
var url = require('url');
var app = express();
app.use(bodyParser.json());
var basicAuth = require('basic-auth-connect');
var auth = basicAuth(function(user, pass) {
  return ((user === 'cs360') && (pass === 'test'));
});

var options = {
  host: 'www.stevenc4.com',
  key: fs.readFileSync('ssl/server.key'),
  cert: fs.readFileSync('ssl/server.crt')
};

  http.createServer(app).listen(80);
  https.createServer(options, app).listen(443);
  
  app.use('/', express.static('./html', {maxAge: 60*60*1000}));
  
  app.get('/getcity', function(req, res){
    var urlObj = url.parse(req.url, true, false);
    console.log("In getcity route");
    fs.readFile(DATA_DIR + "/cities.dat.txt", function(err, data){
      if (err) throw err;
      var cities = data = data.toString().split("\n");
      var regex = new RegExp("^"+urlObj.query["q"]);
      var jsonResult = [];
      for (var i = 0; i < cities.length; i++) {
        var result = cities[i].search(regex);
        if (result != -1) {
          console.log(cities[i]);
          jsonResult.push({city:cities[i]});
        }
      }
      console.log(jsonResult);
      res.writeHead(200, {"Content-Type": "application/json"});
      res.end(JSON.stringify(jsonResult));
    });
  });
  
  app.get('/comment', function(req, res){
    console.log("In comment route");
    MongoClient.connect("mongodb://localhost/comments", function(err, db){
      if (err) {
        res.writeHead(500);
        res.end("Error querying the collection");
      } else {
        db.collection("comments").find(function(err, items){
          if (err) {
            res.writeHead(500);
            res.end("Error querying the collection");
          } else {
            items.toArray(function(err, itemArr){
              if (err) {
                res.writeHead(500);
                res.end("Error casting result to array");
              } else {
                res.writeHead(200, {"Content-Type": "application/json"});
                res.end(JSON.stringify(itemArr));
              }
            });
          }
        });
      }
    });
  });

  app.post('/comment', auth, function(req, res){
    console.log("In POST comment route");
    console.log(req.body);
    console.log(req.user);
    var reqObj = req.body;
    MongoClient.connect("mongodb://localhost/comments", function(err, db){
      if (err) {
        res.writeHead(500);
        res.end("Error connecting to the database");
      } else {
        db.collection('comments').insert(reqObj, function(err, records){
          if (err) {
            res.writeHead(500);
            res.end("Error writing to the collection");
          } else {
            res.writeHead(200);
            res.end();
          }
        });
      }
    });
  });
