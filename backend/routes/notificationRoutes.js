const router = require("express").Router();

const auth = require("../middleware/authMiddleware");
const { formatNotification, readData, writeData } = require("../utils/storage");

router.get("/", auth, (req, res) => {
  const data = readData();
  const notifications = data.notifications
    .filter((entry) => entry.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(formatNotification);

  res.json(notifications);
});

router.post("/read-all", auth, (req, res) => {
  const data = readData();
  data.notifications.forEach((entry) => {
    if (entry.userId === req.user.id) {
      entry.read = true;
    }
  });
  writeData(data);
  res.json({ success: true });
});

module.exports = router;
