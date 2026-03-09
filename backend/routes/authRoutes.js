const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const auth = require("../middleware/authMiddleware");
const {
  createId,
  readData,
  writeData,
  sanitizeUser
} = require("../utils/storage");

const JWT_SECRET = process.env.JWT_SECRET || "startup-validator-secret";

router.post("/register", async (req, res) => {
  try {
    const name = (req.body.name || "").trim();
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "";

    if (!name || !email || password.length < 6) {
      return res.status(400).json({ message: "Name, email, and a password with 6+ characters are required" });
    }

    const data = readData();
    const existingUser = data.users.find((user) => user.email === email);
    if (existingUser) {
      return res.status(409).json({ message: "An account already exists for this email" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      id: createId(),
      name,
      email,
      passwordHash,
      headline: "Founder exploring startup validation",
      bio: `${name} is building and validating startup ideas on the platform.`,
      location: "India",
      interests: ["Startup validation", "Networking"],
      skills: ["Idea research"],
      links: { linkedin: "", website: "" },
      createdAt: new Date().toISOString()
    };

    data.users.push(user);
    writeData(data);

    const safeUser = sanitizeUser(user);
    const token = jwt.sign(safeUser, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user: safeUser });
  } catch (error) {
    res.status(500).json({ message: "Unable to register right now" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "";

    const data = readData();
    const user = data.users.find((entry) => entry.email === email);
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const safeUser = sanitizeUser(user);
    const token = jwt.sign(safeUser, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: safeUser });
  } catch (error) {
    res.status(500).json({ message: "Unable to login right now" });
  }
});

router.get("/me", auth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
