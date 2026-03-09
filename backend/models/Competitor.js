const mongoose = require("mongoose");

const competitorSchema = new mongoose.Schema({
  name: String,
  industry: String
});

module.exports = mongoose.model("Competitor", competitorSchema);
