var express = require('express');
var router = express.Router();
var pug = require('pug');
var fs = require('fs');
const mysql = require('mysql');
const path  = require('path');
const moment = require('moment');


const lines_in = fs.readFileSync('mysqllogin.txt', 'UTF-8');
const lines_split = lines_in.split(/\r?\n/);

var mysql_login = {};
mysql_login.host = lines_split[0];
mysql_login.user = lines_split[1];
mysql_login.password = lines_split[2];
mysql_login.database = lines_split[3];

var pool = mysql.createPool(mysql_login);

getGroupNotes = function(id, callback) {
  pool.getConnection(function(err, con) {
    if (err) throw err;
    var sql = `SELECT * FROM notes WHERE group_id='${id}'`;
    con.query(sql, callback);
  });
};

getInstances = function(callback) {
  pool.getConnection(function(err, con) {
    if (err) throw err;
    var sql = 'SELECT * FROM instances';
    con.query(sql, callback);
  });
};

getInstance = function(id, callback) {
  pool.getConnection(function(err, con) {
    if (err) throw err;
    var sql = `SELECT * FROM instances WHERE group_id='${id}'`;
    con.query(sql, callback);
  });
};

insertInstance = function(post, callback) {
  pool.getConnection(function(err, con) {
    if (err) throw err;
    var sql = 'INSERT INTO instances SET ?';
    con.query(sql, post, callback);
  });
};

insertNote = function(post, callback) {
  pool.getConnection(function(err, con) {
    if (err) throw err;
    var sql = 'INSERT INTO notes SET ?';
    con.query(sql, post, callback);
  });
};

deleteNote = function(delete_query, callback) {
  pool.getConnection(function(err, con) {
    if (err) throw err;
    con.query(delete_query, callback);
  });
};

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

var generate_uid = function(callback) {
  var id = makeid(16);
  getInstance(id, function(err, result, fields) {
    if (err) throw err;
    if (result.length !== 0) generate_uid(callback);
    else callback(id);
  });
};




var createGroupPage = function(id, res) {
  getGroupNotes(id, function(err, result, fields) {
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

getInstances(function(err, result, fields) {
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
  generate_uid(function(uid) {
    // referenced from https://stackoverflow.com/questions/23977548/using-node-js-express-and-mysql-to-insert-for-a-timestamp
    var mysqlTimestamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
    var post = {
      group_id : uid,
      modified : mysqlTimestamp
    };

    insertInstance(post, function(err, result) {
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

  insertNote(post, function(err, result) {
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

  deleteNote(delete_query, function(err, result) {
      if (err) throw err;
    });
});



module.exports = router;
