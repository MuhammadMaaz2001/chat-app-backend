import Message from "../models/Message.js";
import Chat from "../models/Chat.js";

export const sendMessage = async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) return res.status(400).json({ message: "Invalid data" });

  const message = await Message.create({
    sender: req.user._id,
    content,
    chat: chatId,
  });

  await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

  const fullMessage = await Message.findById(message._id)
    .populate("sender", "name email avatar")
    .populate("chat");

  res.status(201).json(fullMessage);
};

export const getMessages = async (req, res) => {
  const { chatId, page = 1, limit = 20 } = req.query;

  const messages = await Message.find({ chat: chatId })
    .sort({ createdAt: -1 }) // latest first
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .populate("sender", "name avatar")
    .populate("chat");

  res.json(messages.reverse()); // reverse to send oldest → latest
};
