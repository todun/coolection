var cluster = require('cluster');
var AWS = require('aws-sdk');
var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var cheerio = require('cheerio');
var validUrl = require('valid-url');

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

app.get('/api/getTitle', function(req, res) {
	var url = req.query.url;
	if (validUrl.isUri(url)) {
		request(url, function (error, response, body) 
		{
			if (!error && response.statusCode == 200) 
			{
				var $ = cheerio.load(body);
				var title = $("title").text();
				res.send(title);
			} else {
				res.send("Can't fetch website. Check if URL is valid.");
			}
		})
	} else {
		res.send("Can't fetch website. Check if URL is valid.");
	}
});