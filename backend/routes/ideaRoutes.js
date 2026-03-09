const express = require("express");

const auth = require("../middleware/authMiddleware");
const { analyzeIdea } = require("../utils/ideaAnalyzer");
const {
  createId,
  formatIdea,
  readData,
  writeData
} = require("../utils/storage");

const router = express.Router();

router.get("/", (_req, res) => {
  const data = readData();
  const ideas = data.ideas
    .slice()
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .map((idea) => formatIdea(idea, data));

  res.json(ideas);
});

router.get("/:ideaId", (req, res) => {
  const data = readData();
  const idea = data.ideas.find((entry) => entry.id === req.params.ideaId);

  if (!idea) {
    return res.status(404).json({ message: "Idea not found" });
  }

  res.json(formatIdea(idea, data));
});

router.post("/", auth, (req, res) => {
  const title = (req.body.title || "").trim();
  const description = (req.body.description || "").trim();

  if (title.length < 5 || description.length < 40) {
    return res.status(400).json({
      message: "Please provide a clear title and at least 40 characters of description"
    });
  }

  const analysis = analyzeIdea(title, description);
  const data = readData();
  const idea = {
    id: createId(),
    title,
    description,
    authorId: req.user.id,
    analysis,
    createdAt: new Date().toISOString()
  };

  data.ideas.push(idea);
  writeData(data);

  res.status(201).json(formatIdea(idea, data));
});

module.exports = router;
