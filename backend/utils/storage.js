const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_PATH = path.join(__dirname, "..", "..", "data", "platform-data.json");

function normalizeUser(user = {}) {
  return {
    ...user,
    headline: user.headline || "Founder building the next big thing",
    bio: user.bio || "Tell the community what you're building and what kind of founders you want to meet.",
    location: user.location || "India",
    interests: Array.isArray(user.interests) ? user.interests : [],
    skills: Array.isArray(user.skills) ? user.skills : [],
    links: user.links || { linkedin: "", website: "" }
  };
}

function normalizeDataShape(data) {
  return {
    users: Array.isArray(data.users) ? data.users.map(normalizeUser) : [],
    ideas: Array.isArray(data.ideas) ? data.ideas : [],
    comments: Array.isArray(data.comments) ? data.comments : [],
    connections: Array.isArray(data.connections) ? data.connections : [],
    messages: Array.isArray(data.messages) ? data.messages : [],
    notifications: Array.isArray(data.notifications) ? data.notifications : []
  };
}

function ensureDataFile() {
  const directory = path.dirname(DATA_PATH);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(normalizeDataShape({}), null, 2));
  }
}

function readData() {
  ensureDataFile();
  const raw = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const normalized = normalizeDataShape(raw);
  if (JSON.stringify(raw) !== JSON.stringify(normalized)) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(normalized, null, 2));
  }
  return normalized;
}

function writeData(data) {
  ensureDataFile();
  fs.writeFileSync(DATA_PATH, JSON.stringify(normalizeDataShape(data), null, 2));
}

function createId() {
  return crypto.randomUUID();
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const normalized = normalizeUser(user);
  return {
    id: normalized.id,
    name: normalized.name,
    email: normalized.email,
    headline: normalized.headline,
    bio: normalized.bio,
    location: normalized.location,
    interests: normalized.interests,
    skills: normalized.skills,
    links: normalized.links
  };
}

function formatComment(comment, data) {
  const author = data.users.find((user) => user.id === comment.userId);
  return { ...comment, user: sanitizeUser(author) };
}

function formatIdea(idea, data) {
  const author = data.users.find((user) => user.id === idea.authorId);
  const comments = data.comments.filter((comment) => comment.ideaId === idea.id);

  return {
    ...idea,
    author: sanitizeUser(author),
    commentCount: comments.length
  };
}

function getConnectionStatus(data, currentUserId, targetUserId) {
  if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
    return null;
  }

  const connection = data.connections.find(
    (entry) =>
      (entry.requesterId === currentUserId && entry.receiverId === targetUserId) ||
      (entry.requesterId === targetUserId && entry.receiverId === currentUserId)
  );

  if (!connection) {
    return null;
  }

  if (connection.status === "accepted") {
    return { state: "connected", connectionId: connection.id };
  }

  if (connection.requesterId === currentUserId) {
    return { state: "outgoing", connectionId: connection.id };
  }

  return { state: "incoming", connectionId: connection.id };
}

function buildFounderSummary(user, data, viewerId) {
  const safeUser = sanitizeUser(user);
  if (!safeUser) {
    return null;
  }

  const ideaCount = data.ideas.filter((idea) => idea.authorId === user.id).length;
  const connectionCount = data.connections.filter(
    (entry) => entry.status === "accepted" && (entry.requesterId === user.id || entry.receiverId === user.id)
  ).length;

  return {
    ...safeUser,
    stats: {
      ideaCount,
      connectionCount,
      commentCount: data.comments.filter((comment) => comment.userId === user.id).length
    },
    relationship: getConnectionStatus(data, viewerId, user.id)
  };
}

function buildFounderProfile(user, data, viewerId) {
  const ideas = data.ideas
    .filter((idea) => idea.authorId === user.id)
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .map((idea) => formatIdea(idea, data));

  return {
    ...buildFounderSummary(user, data, viewerId),
    ideas
  };
}

function createConversationKey(userA, userB) {
  return [userA, userB].sort().join(":");
}

function formatNotification(notification) {
  return {
    ...notification,
    read: Boolean(notification.read)
  };
}

module.exports = {
  buildFounderProfile,
  buildFounderSummary,
  createConversationKey,
  createId,
  formatComment,
  formatIdea,
  formatNotification,
  getConnectionStatus,
  readData,
  sanitizeUser,
  writeData
};
