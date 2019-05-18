const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const boardSchema = Schema({
  _id: Schema.Types.ObjectId,
  board_name: { type: String, required: true, minlength: 3, maxlength: 10 },
  threads: [{ type: Schema.Types.ObjectId, ref: 'Thread' }]
});

// [{ type: Schema.Types.ObjectId, ref: 'Thread' }]
module.exports = mongoose.model('Board', boardSchema);
