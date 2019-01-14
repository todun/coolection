var cluster = require('cluster');
var AWS = require('aws-sdk');
var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var cheerio = require('cheerio');
var validUrl = require('valid-url');
require('dotenv').config();

AWS.config.region = process.env.REGION

var app = express();

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended:false}));

app.get('/', function(req, res) {
	res.render('index');
});

var port = process.env.PORT || 3000;

var server = app.listen(port, function () {
	console.log('Server running at http://localhost:' + port + '/');
});

app.get('/api/getTitle', function(req, res) {
	var url = req.query.url;
	if (validUrl.isUri(url)) {
		request(url, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				var $ = cheerio.load(body);
				var title = $("title").text();
				res.send(title);
			} else {
				res.send("Can’t fetch URL details. Click to edit title.");
			}
		})
	} else {
		res.send("Can't fetch website. Check if URL is valid.");
	}
});

app.get('/api/getTags', function(req, res) {
	var url = req.query.url;
	if (validUrl.isUri(url)) {
		request('https://api.dandelion.eu/datatxt/nex/v1/?url=' + url + '&min_confidence=0.5&social=False&include=image%2Cabstract%2Ctypes%2Ccategories%2Clod&country=-1&token=' + process.env.DANDELION_TOKEN, function (error, response, body) {
			var tags = [];

			if (response.statusCode === 200) {
				JSON.parse(response.body).annotations.forEach(entity => {
					if (tags.indexOf(entity.title) === -1)
						tags.push(entity.title);
				})
			}

			res.send(tags);
		})
	} else {
		res.send('Can\'t fetch website. Check if URL is valid');
	}
});