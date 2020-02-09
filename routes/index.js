var express = require('express');
var router = express.Router();
var fs = require('fs');
const mysql = require('mysql');
const path  = require('path');
const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const moment = require('moment');

const workspace = require('./workspace.js');



// referenced from https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
function makeid(length) {
	var result           = '';
	var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var charactersLength = characters.length;
	for ( var i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

var generate_uid = function(con, callback) {
	var id = makeid(16);
	con.query(`SELECT * FROM instances WHERE group_id='${id}'`, function(err, result, fields) {
		if (err) throw err;
		if (result.length !== 0) generate_uid(con, callback);
		else callback(id);
	});
};



rl.question("root password: ", function(input) {
	var con = mysql.createConnection({
		host: "localhost",
		user: "root",
		password: input,
		database: "keept"
	});

	con.connect(function(err) {
		if (err) throw err;

		function createWorkspace(req, res) {
			workspace(req, res, con);
		}

		con.query('SELECT * FROM instances', function(err, result, fields) {
			if (err) throw err;
			for (group of result) {
				router.get('/' + group['group_id'], createWorkspace);
			}
		});

		router.get('/', function(req, res) {
			res.sendFile('index.html', {
				root: path.join(__dirname, '../')
			});
		});

		router.post('/workspace', function(req, res) {
			generate_uid(con, function(id) {
				// referenced from https://stackoverflow.com/questions/23977548/using-node-js-express-and-mysql-to-insert-for-a-timestamp
				var mysqlTimestamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
				var post = {
					group_id : id,
					modified : mysqlTimestamp
				};

				con.query('INSERT INTO instances SET ?', post, function(err, result) {
					if (err) throw err;
    		});

    		router.get('/' + id, createWorkspace);

				res.redirect('./' + id);

			});
		});

	});
});



module.exports = router;
