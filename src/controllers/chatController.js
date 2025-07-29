import Chat from "../models/Chat.js";
import User from "../models/User.js";
import { getIO, onlineUsers } from "../socket/index.js";


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
  const chats = await Chat.find({ users: req.user._id , isDeleted: false })
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


export const createGroupChat = async (req, res) => {
  const { name, users } = req.body;

  if (!name || !users) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const parsedUsers = typeof users === "string" ? JSON.parse(users) : users;

  if (parsedUsers.length < 2) {
    return res.status(400).json({ message: "At least 2 members required to form a group" });
  }

  parsedUsers.push(req.user._id); // Add the creator

  const groupChat = await Chat.create({
    chatName: name,
    isGroupChat: true,
    users: parsedUsers,
    groupAdmin: req.user._id,
  });

  const populatedChat = await groupChat.populate("users", "-password").execPopulate();
  const io = getIO();

const groupId = groupChat._id;
const groupName = groupChat.chatName || "New Group";

for (const member of parsedUsers) {
  // Skip notification to the creator
  if (member.toString() === req.user._id.toString()) continue;

  await Notification.create({
    recipient: member,
    sender: req.user._id,
    type: "group_event",
    content: `You were added to group "${groupName}"`,
    link: `/chats/${groupId}`,
  });

  const socketId = onlineUsers.get(member.toString());
  if (socketId) {
    io.to(socketId).emit("notification", {
      type: "group_event",
      content: `You were added to group "${groupName}"`,
      chatId: groupId,
      timestamp: new Date(),
    });
  }
}


  res.status(201).json(populatedChat);
};

export const renameGroup = async (req, res) => {
  const { chatId, name } = req.body;

  const updated = await Chat.findByIdAndUpdate(
    chatId,
    { chatName: name },
    { new: true }
  ).populate("users", "-password");

  res.json(updated);
};

export const addToGroup = async (req, res) => {
  const { chatId, userId } = req.body;

  const updated = await Chat.findByIdAndUpdate(
    chatId,
    { $push: { users: userId } },
    { new: true }
  ).populate("users", "-password");

  await Notification.create({
  recipient: userId,
  sender: req.user._id,
  type: "group_event",
  content: "You were added to a group",
  link: `/chats/${chatId}`,
});

const socketId = onlineUsers.get(userId.toString());
if (socketId) {
  getIO().to(socketId).emit("notification", {
    type: "group_event",
    content: "You were added to a group",
    chatId,
    timestamp: new Date(),
  });
}

  res.json(updated);
};

export const removeFromGroup = async (req, res) => {
  const { chatId, userId } = req.body;

  const updated = await Chat.findByIdAndUpdate(
    chatId,
    { $pull: { users: userId } },
    { new: true }
  ).populate("users", "-password");

  await Notification.create({
  recipient: userId,
  sender: req.user._id,
  type: "group_event",
  content: "You were removed from a group",
  link: `/chats/${chatId}`,
});

const socketId = onlineUsers.get(userId.toString());
if (socketId) {
  getIO().to(socketId).emit("notification", {
    type: "group_event",
    content: "You were removed from a group",
    chatId,
    timestamp: new Date(),
  });
}


  res.json(updated);
};

export const deleteGroupChat = async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;

  const chat = await Chat.findById(chatId);
  if (!chat) return res.status(404).json({ message: "Chat not found" });

  if (!chat.isGroupChat) return res.status(400).json({ message: "Not a group chat" });

  if (chat.groupAdmin.toString() !== userId.toString()) {
    return res.status(403).json({ message: "Only admin can delete the group" });
  }

  // await Chat.findByIdAndDelete(chatId);
  // res.json({ message: "Group chat deleted successfully" });
await Chat.findByIdAndUpdate(chatId, { isDeleted: true });

const io = getIO();
const groupName = chat.chatName || "A group";

for (const member of chat.users) {
  await Notification.create({
    recipient: member,
    sender: req.user._id,
    type: "group_event",
    content: `Group "${groupName}" has been deleted`,
    link: `/chats/${chatId}`,
  });

  const socketId = onlineUsers.get(member.toString());
  if (socketId) {
    io.to(socketId).emit("notification", {
      type: "group_event",
      content: `Group "${groupName}" has been deleted`,
      chatId,
      timestamp: new Date(),
    });
  }
}

res.json({ message: "Group chat deleted successfully" });


};

export const unfriendUser = async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user._id;

  // Delete the contact
  const contact = await Contact.findOneAndDelete({
    $or: [
      { sender: currentUserId, receiver: userId, status: "Accepted" },
      { sender: userId, receiver: currentUserId, status: "Accepted" },
    ]
  });

  // Delete 1-to-1 chat (optional)
  const chat = await Chat.findOneAndDelete({
    isGroupChat: false,
    users: { $all: [currentUserId, userId] }
  });

  if (!contact) {
    return res.status(404).json({ message: "Contact not found or already removed" });
  }

  res.json({ message: "Unfriended successfully" });
};
