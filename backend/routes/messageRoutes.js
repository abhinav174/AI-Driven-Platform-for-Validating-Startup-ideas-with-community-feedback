const router = require("express").Router();

const auth = require("../middleware/authMiddleware");
const {
  createConversationKey,
  createId,
  readData,
  sanitizeUser,
  writeData
} = require("../utils/storage");

function canMessage(data, userId, otherUserId) {
  return data.connections.some(
    (entry) =>
      entry.status === "accepted" &&
      ((entry.requesterId === userId && entry.receiverId === otherUserId) ||
        (entry.requesterId === otherUserId && entry.receiverId === userId))
  );
}

router.get("/conversations", auth, (req, res) => {
  const data = readData();
  const conversations = {};

  data.messages
    .filter((message) => message.senderId === req.user.id || message.receiverId === req.user.id)
    .forEach((message) => {
      const otherUserId = message.senderId === req.user.id ? message.receiverId : message.senderId;
      const existing = conversations[message.conversationKey];
      if (!existing || new Date(message.createdAt) > new Date(existing.lastMessage.createdAt)) {
        conversations[message.conversationKey] = {
          otherUser: sanitizeUser(data.users.find((user) => user.id === otherUserId)),
          lastMessage: message
        };
      }
    });

  res.json(Object.values(conversations).sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)));
});

router.get("/with/:userId", auth, (req, res) => {
  const data = readData();
  const otherUser = data.users.find((user) => user.id === req.params.userId);

  if (!otherUser) {
    return res.status(404).json({ message: "Founder not found" });
  }
  if (!canMessage(data, req.user.id, otherUser.id)) {
    return res.status(403).json({ message: "Accept a connection before sending messages" });
  }

  const key = createConversationKey(req.user.id, otherUser.id);
  const messages = data.messages
    .filter((message) => message.conversationKey === key)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  res.json({ otherUser: sanitizeUser(otherUser), messages });
});

router.post("/with/:userId", auth, (req, res) => {
  const data = readData();
  const otherUser = data.users.find((user) => user.id === req.params.userId);
  const text = (req.body.text || "").trim();

  if (!otherUser) {
    return res.status(404).json({ message: "Founder not found" });
  }
  if (!text) {
    return res.status(400).json({ message: "Message cannot be empty" });
  }
  if (!canMessage(data, req.user.id, otherUser.id)) {
    return res.status(403).json({ message: "Accept a connection before sending messages" });
  }

  const message = {
    id: createId(),
    conversationKey: createConversationKey(req.user.id, otherUser.id),
    senderId: req.user.id,
    receiverId: otherUser.id,
    text,
    createdAt: new Date().toISOString()
  };

  data.messages.push(message);
  data.notifications.push({
    id: createId(),
    userId: otherUser.id,
    type: "message",
    text: `${req.user.name} sent you a new message.`,
    link: `/messages/${req.user.id}`,
    read: false,
    createdAt: new Date().toISOString()
  });

  writeData(data);
  res.status(201).json(message);
});

module.exports = router;
