const express = require('express');
const fs = require('fs');
const app = express();
var https = require('https');
var http = require('http');
var {child_process, spawn} = require('child_process');

// Allow CORS - Remove if not needed.
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(express.static('mochawesome-report'));

let isRunning = false;
let state = "IDLE"
let lastStartTime = "";

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

app.get('/run', (req, res) => asyncTest(req, res));


async function asyncTest(req, res){
	var query = "";

	Object.keys(req.query).forEach(function(key, index){
		var value = req.query[key];
		query = query + (value + " ");
	})

	var find = "\"";
	var re = new RegExp(find, 'g')

	//query = query.replace(re, "\\\"");

	var command = ".\\RunCypress.ps1 -options '" + query + "'";

	child = spawn("powershell.exe",[command],
		{ stdio: [process.stdin, process.stdout, process.stderr] });

	await onExit(child);

	res.json({
		"isRunning": isRunning,
		"state" : state,
		"lastStartTime" : lastStartTime
	});
}

function onExit(childProcess) {
  return new Promise((resolve, reject) => {
    childProcess.once('exit', (code, signal) => {
      if (code === 0) {
        resolve(undefined);
      } else {
        reject(new Error('Exit with error code: '+code));
      }
    });
    childProcess.once('error', (err) => {
      reject(err);
    });
  });
}

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

let port = process.env.PORT || 3000;

http.createServer(app).listen(3000);
console.log(`listening on port ${port}!`);

var options = {
	key: fs.readFileSync('./key.pem', 'utf8'),
	cert: fs.readFileSync('./server.crt', 'utf8')
}

https.createServer(options, app).listen(3333);
console.log(`listening on port 3333!`);

function urldecode(str) {
	return decodeURIComponent((str+'').replace(/\+/g, '%20'));
}