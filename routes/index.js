var express = require('express');
var router = express.Router();
var pug = require('pug');
var fs = require('fs');
const mysql = require('mysql');
const path  = require('path');
const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
const moment = require('moment');



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

    var createGroupPage = function(id, res) {
      con.query(`SELECT * FROM notes WHERE group_id='${id}'`, function(err, result, fields) {
        if (err) throw err;
        var note_data = {};
        for (comment of result) {
          if (!(comment['note'] in note_data)) {
            note_data[comment['note']] = [comment['description']];
          }
          else {
            note_data[comment['note']].push(comment['description']);
          }
        }
        res.render('workspace', { note_data : note_data });
      });
    };

    con.query('SELECT * FROM instances', function(err, result, fields) {
      if (err) throw err;
      for (group of result) {
        router.get('/' + group['group_id'], function(req, res) {
          createGroupPage(group['group_id'], res);
        });
      }
    });

    router.get('/', function(req, res) {
      res.render('index');
    })

    router.post('/workspace', function(req, res) {
      generate_uid(con, function(uid) {
        // referenced from https://stackoverflow.com/questions/23977548/using-node-js-express-and-mysql-to-insert-for-a-timestamp
        var mysqlTimestamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
        var post = {
          group_id : uid,
          modified : mysqlTimestamp
        };

        con.query('INSERT INTO instances SET ?', post, function(err, result) {
          if (err) throw err;
        });

        router.get('/' + uid, function(req, res) {
          createGroupPage(uid, res);
        });

        res.redirect('./' + uid);

      });
    });

    router.post('/newnote', function(req, res) {
      var mysqlTimestamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
      var post = {
        description : req.body['description'],
        note : req.body['note'],
        group_id : req.body['group_id'],
        modified : mysqlTimestamp
      }

      con.query('INSERT INTO notes SET ?', post, function(err, result) {
          if (err) throw err;
        });
    });

    router.post('/deletenote', function(req, res) {
      var delete_query = `
        DELETE FROM notes
        WHERE description='${req.body['description']}'
        AND note='${req.body['note']}'
        AND group_id='${req.body['group_id']}'
      `

      console.log(delete_query);
      con.query(delete_query, function(err, result) {
          if (err) throw err;
          console.log(result);
        });
    });

  });
});


module.exports = router;
