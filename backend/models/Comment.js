const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  text: String,
  idea: { type: mongoose.Schema.Types.ObjectId, ref: "Idea" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Comment", commentSchema);
