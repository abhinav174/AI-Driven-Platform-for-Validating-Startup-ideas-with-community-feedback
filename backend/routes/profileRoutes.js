const router = require("express").Router();

const auth = require("../middleware/authMiddleware");
const {
  buildFounderProfile,
  readData,
  writeData
} = require("../utils/storage");

router.get("/me", auth, (req, res) => {
  const data = readData();
  const user = data.users.find((entry) => entry.id === req.user.id);

  if (!user) {
    return res.status(404).json({ message: "Profile not found" });
  }

  res.json(buildFounderProfile(user, data, req.user.id));
});

router.put("/me", auth, (req, res) => {
  const data = readData();
  const user = data.users.find((entry) => entry.id === req.user.id);

  if (!user) {
    return res.status(404).json({ message: "Profile not found" });
  }

  user.headline = (req.body.headline || user.headline || "").trim();
  user.bio = (req.body.bio || user.bio || "").trim();
  user.location = (req.body.location || user.location || "").trim();
  user.interests = Array.isArray(req.body.interests) ? req.body.interests.slice(0, 8) : user.interests;
  user.skills = Array.isArray(req.body.skills) ? req.body.skills.slice(0, 8) : user.skills;
  user.links = {
    linkedin: req.body.links?.linkedin || user.links?.linkedin || "",
    website: req.body.links?.website || user.links?.website || ""
  };

  writeData(data);
  res.json(buildFounderProfile(user, data, req.user.id));
});

router.get("/users", auth, (req, res) => {
  const data = readData();
  const profiles = data.users
    .filter((user) => user.id !== req.user.id)
    .map((user) => buildFounderProfile(user, data, req.user.id));

  res.json(profiles);
});

router.get("/users/:userId", auth, (req, res) => {
  const data = readData();
  const user = data.users.find((entry) => entry.id === req.params.userId);

  if (!user) {
    return res.status(404).json({ message: "Founder not found" });
  }

  res.json(buildFounderProfile(user, data, req.user.id));
});

module.exports = router;
