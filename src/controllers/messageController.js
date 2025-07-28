import Message from "../models/Message.js";
import Chat from "../models/Chat.js";
import User from "../models/User.js";
import Contact from "../models/Contact.js";

// export const sendMessage = async (req, res) => {
//   const { content, chatId } = req.body;

//   if (!content || !chatId) return res.status(400).json({ message: "Invalid data" });

//   const message = await Message.create({
//     sender: req.user._id,
//     content,
//     chat: chatId,
//   });

//   await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

//   const fullMessage = await Message.findById(message._id)
//     .populate("sender", "name email avatar")
//     .populate("chat");

//   res.status(201).json(fullMessage);
// };

export const sendMessage = async (req, res) => {
  const { chatId, content } = req.body;
  const userId = req.user._id;

  const chat = await Chat.findById(chatId).populate("users", "_id");

  if (!chat) return res.status(404).json({ message: "Chat not found" });

  // Ensure user is in this chat
  if (!chat.users.some((u) => u._id.toString() === userId.toString())) {
    return res.status(403).json({ message: "Not part of this chat" });
  }

  // Get the other participant (for private chats)
  const recipientId = chat.users.find((u) => u._id.toString() !== userId.toString())?._id;

  // ✅ Check if sender and receiver are contacts (only for 1-to-1 chats)
  if (!chat.isGroupChat && recipientId) {
    const isContact = await Contact.findOne({
      $or: [
        { sender: userId, receiver: recipientId, status: "Accepted" },
        { sender: recipientId, receiver: userId, status: "Accepted" },
      ],
    });

    if (!isContact) {
      return res.status(403).json({ message: "You must be contacts to chat." });
    }
  }

  const message = await Message.create({
    sender: userId,
    content,
    chat: chatId,
  });

  const fullMessage = await message.populate("sender", "name email avatar");
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
