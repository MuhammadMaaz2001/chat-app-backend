import Message from "../models/Message.js";
import Chat from "../models/Chat.js";
import User from "../models/User.js";
import Contact from "../models/Contact.js";
import cloudinary from "../utils/cloudinary.js";
import Notification from "../models/Notification.js";
import { getIO ,onlineUsers } from "../socket/index.js"


export const sendMessage = async (req, res) => {
  try {
    const { chatId, content } = req.body;
    const userId = req.user._id;

    // 1. Validate chat
    const chat = await Chat.findById(chatId).populate("users", "_id");
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    // 2. Check if sender is part of the chat
    if (!chat.users.some((u) => u._id.toString() === userId.toString())) {
      return res.status(403).json({ message: "Not part of this chat" });
    }

    const isGroup = chat.isGroupChat;

    // 3. For private chats, check block list and contact
    let recipientId = null;
    let recipient = null;

    if (!isGroup) {
      recipientId = chat.users.find((u) => u._id.toString() !== userId.toString())?._id;

      if (!recipientId) {
        return res.status(400).json({ message: "Recipient not found in private chat" });
      }

      recipient = await User.findById(recipientId);
      if (!recipient) {
        return res.status(404).json({ message: "Recipient user not found" });
      }

      if (recipient.blockedUsers.includes(userId)) {
        return res.status(403).json({ message: "You are blocked by this user" });
      }

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

    // 4. Upload media files (if any)
    let mediaUrls = [];
    if (req.files && req.files.length > 0) {
      try {
        const uploadPromises = req.files.map((file) => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { resource_type: "image" },
              (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
              }
            );
            stream.end(file.buffer);
          });
        });

        mediaUrls = await Promise.all(uploadPromises);
      } catch (err) {
        return res.status(500).json({ message: "Image upload failed", error: err.message });
      }
    }

    // 5. Create message
    const message = await Message.create({
      sender: userId,
      content,
      chat: chatId,
      mediaUrls,
    });

    // 6. Create notification for private chat
    if (!isGroup && recipientId) {
  const recipientSocketId = onlineUsers.get(recipientId?.toString());
  if (recipientSocketId) {
    io.to(recipientSocketId).emit("message-received", {
      ...message.toObject(),
      chat: chat.toObject(),
      sender: {
        _id: req.user._id,
        name: req.user.name,
        avatar: req.user.avatar,
      },
    });
  }
}


    // 7. Real-time notification via socket.io
    const io = getIO();
    const recipientSocketId = onlineUsers.get(recipientId?.toString());
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("notification", {
        type: "message",
        from: req.user.name,
        chatId: chatId,
        content: content || "📎 Media",
        timestamp: new Date(),
      });
    }

    // 8. Return populated message
    const fullMessage = await message.populate("sender", "name email avatar");
    res.status(201).json(fullMessage);

  } catch (err) {
    console.error("SendMessage Error:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};


export const getMessages = async (req, res) => {
  const { chatId, page = 1, limit = 20 } = req.query;

  // const messages = await Message.find({ chat: chatId ,})
  const messages = await Chat.findByIdAndUpdate(chatId, { isDeleted: true })
    .sort({ createdAt: -1 }) // latest first
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .populate("sender", "name avatar")
    .populate("chat");

  res.json(messages.reverse()); // reverse to send oldest → latest
};

export const getUnreadCount = async (req, res) => {
  const chats = await Chat.find({ users: req.user._id });

  const unreadCounts = await Promise.all(
    chats.map(async (chat) => {
      const count = await Message.countDocuments({
        chat: chat._id,
        sender: { $ne: req.user._id },
        isRead: false,
        isDeleted: false
      });
      return { chatId: chat._id, unreadCount: count };
    })
  );

  res.json(unreadCounts);
};
