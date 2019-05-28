const express = require('express');
const fs = require('fs');
const app = express();
var https = require('https');
var http = require('http');
var cypress = require('cypress');
var marge = require('mochawesome-report-generator');
var { merge } = require('mochawesome-merge');
var bodyParser = require('body-parser');
const glob = require("glob");

// Allow CORS - Remove if not needed.
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(express.static('mochawesome-report'));
app.use(bodyParser.json());

let isRunning = false;
let state = "IDLE"
let lastStartTime = "";

//Define "endpointss"

app.get('/', (req, res) =>
{
    res.json({
		"isRunning": isRunning,
		"state" : state
	});
});

app.get('/report', (req, res) =>
{
    res.sendFile(__dirname + '/mochawesome-report/mochawesome.html');
});

app.post('/run', async function (req, res){
	
	glob("mochawesome-report/*.json", function(er, files) {
		for (const file of files){
			fs.unlink(file, function(err) {
				if (err){
					console.error(err);
				}
			});
		}
	});

	await cypress.run(req.body).then(
		() => {
			generateReport();
		},
		error => {
			generateReport();
			console.error(error);
		}
	);

	res.json({
		"isRunning": isRunning,
		"state" : state,
		"lastStartTime" : lastStartTime
	});
	
});

app.get('/results', (req, res) =>
{
	let verbose = req.query.v || false;
	
	let rawData = fs.readFileSync('./mochawesome-report/mochawesome.json');  
	let parsedData = JSON.parse(rawData);  
	
	parsedData.stats.status = { 
		"isRunning": isRunning,
		"state" : state,
		"lastStartTime" : lastStartTime
	};

	verbose ? res.json(parsedData) : res.json(parsedData.stats);
});

//Create Servers

var options = {
	key: fs.readFileSync('./key.pem', 'utf8'),
	cert: fs.readFileSync('./server.crt', 'utf8')
}

http.createServer(app).listen(3000);
console.log(`listening on port 3000!`);

https.createServer(options, app).listen(3333);
console.log(`listening on port 3333!`);

function generateReport(options){
	return merge(options).then(report => marge.create(report, options));
}