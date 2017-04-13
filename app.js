var cluster = require('cluster');
var AWS = require('aws-sdk');
var express = require('express');
var bodyParser = require('body-parser');

AWS.config.region = process.env.REGION

var app = express();

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended:false}));

app.get('/', function(req, res) {
	res.render('index');
});

var port = process.env.PORT || 3000;

var server = app.listen(port, function () {
	console.log('Server running at http://127.0.0.1:' + port + '/');
});