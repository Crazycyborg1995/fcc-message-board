'use strict';

var expect = require('chai').expect;
const mongoose = require('mongoose');
const Board = require('../models/Board');
const Thread = require('../models/Thread');
const Reply = require('../models/Reply');

// Basic Config
require('dotenv').config({ path: 'process.env' });

const env = process.env.NODE_ENV || 'production';
if (env === 'development') {
  process.env.MONGODB_URI = process.env.MONGODB_LOCAL;
} else if (env === 'production') {
  process.env.MONGODB_URI = `mongodb+srv://afsal:${
    process.env.PASSWORD
  }@message-board-cpqfk.mongodb.net/test?retryWrites=true`;
}

// DB Config
mongoose.Promise = global.Promise;
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true
  })
  .then(() => console.log('connected on mongodb server'))
  .catch(err => console.log(err));

module.exports = function(app) {
  // adding a thread
  app
    .route('/api/threads')
    .post(async function(req, res) {
      let { board, text, password } = req.body;
      board = await Board.findOne({ board_name: board })
        .then(board => {
          if (board) {
            return board;
          }
          return null;
        })
        .catch(err => null);

      if (!board) {
        board = new Board({
          _id: mongoose.Types.ObjectId(),
          board_name: req.body.board
        });
      }
      let newThread = new Thread({
        _id: new mongoose.Types.ObjectId(),
        text,
        password,
        board: board._id
      });
      // Add thread to board
      board.threads.push(newThread);
      newThread
        .save()
        .then(doc => {
          if (doc) {
            board.save().then(thread => {
              return res.status(200).json({ thread, board });
            });
          } else {
            res.json('Failed to save');
          }
        })
        .catch(err => res.json(err));
    })

    .put(async function(req, res) {
      let { id } = req.body;
      Thread.findByIdAndUpdate(id, { $set: { reported: true } })
        .then(doc => {
          if (doc) {
            return res.json({ msg: true });
          }
          res.json({ msg: false });
        })
        .catch(err => res.json({ msg: null }));
    })

    .delete(async function(req, res) {
      let { id, password } = req.body;
      let threadToDelete = await Thread.findOne({
        $and: [{ _id: id }, { password: password }]
      })
        .populate('board')
        .then(thread => {
          if (thread) {
            return thread;
          }
          return false;
        })
        .catch(err => null);
      if (threadToDelete) {
        let board_name = threadToDelete.board.board_name;
        let replyId =
          threadToDelete.replies.length > 0 ? threadToDelete.replies : '';
        if (replyId) {
          for (let id of replyId) {
            let reply = await Reply.findByIdAndDelete(id);
          }
        }
        let board = await Board.findOneAndUpdate(
          { board_name: board_name },
          { $pull: { threads: id } }
        )
          .then(doc => {
            if (doc) {
              return true;
            }
            return false;
          })
          .catch(err => null);
        if (board) {
          let thread = await Thread.findByIdAndRemove(id)
            .then(res => {
              if (res) {
                return true;
              }
              return false;
            })
            .catch(err => null);
          if (thread) {
            return res.json({ msg: true });
          }
          res.json({ msg: false });
        }
      } else {
        res.json({ msg: false });
      }
    });

  // post a comment
  app
    .route('/api/replies/')
    .post(async function(req, res) {
      let { text, password, id } = req.body;
      let thread = await Thread.findById(id);
      if (thread) {
        let newReply = new Reply({
          _id: mongoose.Types.ObjectId(),
          text,
          password,
          created_on: new Date(),
          reported: false
        });

        thread.bumped_on = new Date();
        thread.replies.push(newReply);

        thread.save().then(thread => {
          if (thread) {
            newReply
              .save()
              .then(doc => {
                if (doc) {
                  return res.json({ msg: 'success' });
                }
                return res.json({ msg: err });
              })
              .catch(err => res.json({ msg: 'error' }));
          } else {
            return res.json({ msg: 'error' });
          }
        });
      } else {
        res.json({ msg: 'error' });
      }
    })
    .put(async function(req, res) {
      let { id } = req.body;
      Reply.findByIdAndUpdate(id, {
        $set: { reported: true }
      })
        .then(doc => {
          if (doc) {
            return res.json({ msg: true });
          }
          res.json({ msg: false });
        })
        .catch(err => res.json({ msg: null }));
    })

    .delete(async function(req, res) {
      let { replyId, threadId, password } = req.body;
      let thread = await Thread.findById(threadId)
        .populate({
          path: 'replies',
          model: 'Reply',
          match: { _id: replyId, password: password }
        })
        .then(thread => {
          if (thread.replies.length > 0) {
            return thread;
          }
          return false;
        })
        .catch(err => null);
      if (thread) {
        let reply = await Reply.findByIdAndRemove(replyId)
          .then(reply => {
            if (reply) {
              return true;
            }
            return false;
          })
          .catch(err => null);
        if (reply) {
          let thread = await Thread.findOneAndUpdate(
            { _id: threadId },
            { $pull: { replies: replyId } }
          )
            .then(doc => {
              if (doc) {
                return true;
              }
              return false;
            })
            .catch(err => null);
          if (thread) {
            return res.json({ msg: true });
          }
        }
      }
      res.json({ msg: false });
    });
};
