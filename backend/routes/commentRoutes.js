const router = require("express").Router();

const auth = require("../middleware/authMiddleware");
const {
  createId,
  formatComment,
  readData,
  writeData
} = require("../utils/storage");

router.get("/:ideaId", (req, res) => {
  const data = readData();
  const comments = data.comments
    .filter((comment) => comment.ideaId === req.params.ideaId)
    .sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt))
    .map((comment) => formatComment(comment, data));

  res.json(comments);
});

router.post("/:ideaId", auth, (req, res) => {
  const text = (req.body.text || "").trim();

  if (text.length < 3) {
    return res.status(400).json({ message: "Comment must be at least 3 characters long" });
  }

  const data = readData();
  const idea = data.ideas.find((entry) => entry.id === req.params.ideaId);

  if (!idea) {
    return res.status(404).json({ message: "Idea not found" });
  }

  const comment = {
    id: createId(),
    ideaId: req.params.ideaId,
    userId: req.user.id,
    text,
    createdAt: new Date().toISOString()
  };

  data.comments.push(comment);
  writeData(data);

  res.status(201).json(formatComment(comment, data));
});

module.exports = router;
