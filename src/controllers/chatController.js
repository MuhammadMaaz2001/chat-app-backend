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
