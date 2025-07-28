import Chat from "../models/Chat.js";
import User from "../models/User.js";

// Access or create one-to-one chat
export const accessChat = async (req, res) => {
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ message: "UserId param not sent" });

  let chat = await Chat.findOne({
    isGroupChat: false,
    users: { $all: [req.user._id, userId] },
  }).populate("users", "-password").populate("latestMessage");

  if (chat) return res.json(chat);

  // Create new chat
  const newChat = await Chat.create({
    chatName: "sender",
    isGroupChat: false,
    users: [req.user._id, userId],
  });

  const fullChat = await Chat.findById(newChat._id).populate("users", "-password");
  res.status(201).json(fullChat);
};

// Fetch all chats for user
export const getChats = async (req, res) => {
  const chats = await Chat.find({ users: req.user._id })
    .populate("users", "-password")
    .populate("groupAdmin", "-password")
    .populate("latestMessage")
    .sort({ updatedAt: -1 });

  res.json(chats);
};

// Create or get a chat (only if they are contacts)
export const accessOrCreateChat = async (req, res) => {
  const { userId } = req.body;
  const currentUserId = req.user._id;

  if (!userId) return res.status(400).json({ message: "User ID required" });

  // Check if user is in contacts
  const currentUser = await User.findById(currentUserId);
  if (!currentUser.contacts.includes(userId)) {
    return res.status(403).json({ message: "You are not contacts with this user" });
  }

  // Check for existing chat
  let chat = await Chat.findOne({
    isGroupChat: false,
    users: { $all: [currentUserId, userId] },
  }).populate("users", "-password");

  if (chat) return res.json(chat);

  // Create chat
  chat = await Chat.create({
    isGroupChat: false,
    users: [currentUserId, userId],
  });

  const fullChat = await chat.populate("users", "-password").execPopulate();
  res.status(201).json(fullChat);
};