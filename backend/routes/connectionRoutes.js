const router = require("express").Router();

const auth = require("../middleware/authMiddleware");
const {
  buildFounderSummary,
  createId,
  getConnectionStatus,
  readData,
  writeData
} = require("../utils/storage");

router.get("/", auth, (req, res) => {
  const data = readData();
  const pendingIncoming = data.connections
    .filter((entry) => entry.receiverId === req.user.id && entry.status === "pending")
    .map((entry) => ({
      ...entry,
      requester: buildFounderSummary(data.users.find((user) => user.id === entry.requesterId), data, req.user.id)
    }));

  const pendingOutgoing = data.connections
    .filter((entry) => entry.requesterId === req.user.id && entry.status === "pending")
    .map((entry) => ({
      ...entry,
      receiver: buildFounderSummary(data.users.find((user) => user.id === entry.receiverId), data, req.user.id)
    }));

  const connections = data.connections
    .filter((entry) => entry.status === "accepted" && (entry.requesterId === req.user.id || entry.receiverId === req.user.id))
    .map((entry) => {
      const otherUserId = entry.requesterId === req.user.id ? entry.receiverId : entry.requesterId;
      return {
        ...entry,
        user: buildFounderSummary(data.users.find((user) => user.id === otherUserId), data, req.user.id)
      };
    });

  const suggestions = data.users
    .filter((user) => user.id !== req.user.id)
    .filter((user) => !getConnectionStatus(data, req.user.id, user.id))
    .slice(0, 6)
    .map((user) => buildFounderSummary(user, data, req.user.id));

  res.json({ pendingIncoming, pendingOutgoing, connections, suggestions });
});

router.post("/request/:userId", auth, (req, res) => {
  const data = readData();
  const target = data.users.find((user) => user.id === req.params.userId);

  if (!target) {
    return res.status(404).json({ message: "Founder not found" });
  }
  if (target.id === req.user.id) {
    return res.status(400).json({ message: "You cannot connect with yourself" });
  }
  if (getConnectionStatus(data, req.user.id, target.id)) {
    return res.status(409).json({ message: "A connection already exists or is pending" });
  }

  const connection = {
    id: createId(),
    requesterId: req.user.id,
    receiverId: target.id,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  data.connections.push(connection);
  data.notifications.push({
    id: createId(),
    userId: target.id,
    type: "connection_request",
    text: `${req.user.name} sent you a connection request.`,
    link: `/network`,
    read: false,
    createdAt: new Date().toISOString()
  });

  writeData(data);
  res.status(201).json(connection);
});

router.post("/accept/:connectionId", auth, (req, res) => {
  const data = readData();
  const connection = data.connections.find((entry) => entry.id === req.params.connectionId);

  if (!connection || connection.receiverId !== req.user.id) {
    return res.status(404).json({ message: "Connection request not found" });
  }

  connection.status = "accepted";
  connection.respondedAt = new Date().toISOString();
  data.notifications.push({
    id: createId(),
    userId: connection.requesterId,
    type: "connection_accepted",
    text: `${req.user.name} accepted your connection request.`,
    link: `/messages`,
    read: false,
    createdAt: new Date().toISOString()
  });

  writeData(data);
  res.json(connection);
});

router.post("/decline/:connectionId", auth, (req, res) => {
  const data = readData();
  const connection = data.connections.find((entry) => entry.id === req.params.connectionId);

  if (!connection || connection.receiverId !== req.user.id) {
    return res.status(404).json({ message: "Connection request not found" });
  }

  connection.status = "declined";
  connection.respondedAt = new Date().toISOString();
  writeData(data);
  res.json(connection);
});

module.exports = router;
