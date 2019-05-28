const express = require('express');
const fs = require('fs');
const app = express();
var https = require('https');
var http = require('http');
var cypress = require('cypress')
var bodyParser = require('body-parser')

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
	
	await cypress.run(req.body).then((results) => {
		console.log(results);
	}).catch((err) => {
		console.log(err);
	})

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
console.log(`listening on port ${port}!`);

https.createServer(options, app).listen(3333);
console.log(`listening on port 3333!`);