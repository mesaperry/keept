var express = require('express');
var router = express.Router();
var fs = require('fs');
var mysql = require('mysql');
const path  = require('path');
const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


rl.question("root password: ", function(input) {
	var con = mysql.createConnection({
		host: "localhost",
		user: "root",
		password: input,
		database: "keept"
	});

	con.connect(function(err) {
		if (err) throw err;
		con.query(`SELECT * FROM instances`, function(err, result, fields) {
			if (err) throw err;
			for (group of result) {
				router.get('/' + group['group_id'], function(req, res) {
					res.writeHead(200, {'Content-Type': 'text/html'});
					res.write('meme cat');
					res.end();
				});
			}
		});
	});

	router.get('/', function(req, res) {
		res.sendFile('index.html', {
			root: path.join(__dirname, '../')
		});
	});
});



module.exports = router;
