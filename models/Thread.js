const mongoose = require('mongoose');
const Reply = require('./Reply.js');
const Schema = mongoose.Schema;

const threadSchema = new Schema({
  _id: Schema.Types.ObjectId,
  text: { type: String, required: true },
  password: { type: String, required: true },
  created_on: { type: Date, default: Date.now },
  bumped_on: { type: Date, default: Date.now },
  reported: { type: Boolean, default: false },
  replies: [{ type: Schema.Types.ObjectId, ref: 'Reply' }],
  board: {
    type: Schema.Types.ObjectId,
    ref: 'Board'
  }
});

threadSchema.post('remove', function(doc) {
  Reply.deleteMany(
    {
      _id: { $in: doc.replies }
    },
    {},
    function(err) {}
  );
});

module.exports = mongoose.model('Thread', threadSchema);
