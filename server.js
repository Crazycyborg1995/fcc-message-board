'use strict';

var express = require('express');
const path = require('path');
var bodyParser = require('body-parser');
var expect = require('chai').expect;
var cors = require('cors');
var apiRoutes = require('./routes/api.js');
var fccTestingRoutes = require('./routes/fcctesting.js');
var runner = require('./test-runner');
var app = express();
const port = process.env.PORT || 3000;
const helmet = require('helmet');
const hbs = require('./handler');
const Thread = require('./models/Thread');
const Board = require('./models/Board');
const Reply = require('./models/Reply');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors()); //For FCC testing purposes only

// Set Static Folder
app.use(express.static(path.join(__dirname, 'public')));

// Helmet
app.use(helmet());
app.use(helmet.frameguard({ action: 'same-origin' }));
app.use(helmet.dnsPrefetchControl());
app.use(helmet.referrerPolicy({ policy: 'same-origin' }));

// Express Handlebars
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');

//Index page (static HTML)
app.route('/').get(function(req, res) {
  res.render('index');
});

app.route('/boards/:board').get(async function(req, res) {
  let board = await Board.findOne({ board_name: req.params.board })
    .populate({
      path: 'threads',
      populate: {
        path: 'board',
        model: 'Board'
      }
    })
    .then(board => {
      if (board) return board;
      return null;
    });

  res.render('board', {
    board
  });
});

app.route('/:board/:id').get(async function(req, res) {
  let thread = '';
  let board_name = '';
  let board = await Board.findOne({ board_name: req.params.board })
    .populate({
      path: 'threads',
      match: { _id: req.params.id },
      populate: { path: 'replies', model: 'Reply' }
    })
    .then(board => {
      if (board) {
        return board;
      }
      return null;
    })
    .catch(err => null);

  if (board) {
    thread = board.threads[0];
    board_name = board.board_name;
  }

  res.render('thread', {
    board,
    thread,
    board_name
  });
});

app.route('/boards').get(async function(req, res) {
  let boards = await Board.find()
    .then(boards => {
      if (boards.length > 0) {
        return boards;
      }
      return null;
    })
    .catch(err => null);
  res.render('boards', {
    boards
  });
});

//For FCC testing purposes
fccTestingRoutes(app);

//Routing for API
apiRoutes(app);

//Sample Front-end

//404 Not Found Middleware
app.use(function(req, res, next) {
  res.sendFile(path.join(__dirname + '/public/404.html'));
});

//Start our server and tests!
app.listen(port, function() {
  console.log('Listening on port ' + port);
  if (process.env.NODE_ENV === 'test') {
    console.log('Running Tests...');
    setTimeout(function() {
      try {
        runner.run();
      } catch (e) {
        var error = e;
        console.log('Tests are not valid:');
        console.log(error);
      }
    }, 1500);
  }
});

module.exports = app; //for testing
