const router = require("express").Router();

const { analyzeIdea } = require("../utils/ideaAnalyzer");

router.post("/preview", (req, res) => {
  const title = (req.body.title || "").trim();
  const description = (req.body.description || "").trim();

  if (!title || !description) {
    return res.status(400).json({ message: "Title and description are required" });
  }

  res.json(analyzeIdea(title, description));
});

module.exports = router;
