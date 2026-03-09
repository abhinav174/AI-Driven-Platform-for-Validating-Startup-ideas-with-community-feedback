const mongoose = require("mongoose");

const ideaSchema = new mongoose.Schema({
  title: String,
  description: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  aiScore: Number,
  marketPotential: String,
  estimatedMarketCap: String,
  competitors: [String],

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Idea", ideaSchema);
