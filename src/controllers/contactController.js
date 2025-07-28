
import Contact from "../models/Contact.js";
import Chat from "../models/Chat.js";
import User from '../models/User.js';

// export const sendFriendRequest = async (req, res) => {
//   const { receiverId } = req.body;

//   const existing = await Contact.findOne({
//     sender: req.user._id,
//     receiver: receiverId,
//   });
//   if (existing) return res.status(400).json({ message: "Request already sent" });

//   const contact = await Contact.create({
//     sender: req.user._id,
//     receiver: receiverId,
//   });

//   res.status(201).json(contact);
// };

export const sendFriendRequest = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const receiverUser = await User.findOne({ email: receiverId });

    if (!receiverUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const existing = await Contact.findOne({
      sender: req.user._id,
      receiver: receiverUser._id,
    });

    if (existing) {
      return res.status(400).json({ message: "Request already sent" });
    }

    const contact = await Contact.create({
      sender: req.user._id,
      receiver: receiverUser._id,
    });

    res.status(201).json(contact);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const respondToRequest = async (req, res) => {
  const { contactId } = req.params;
  const { action } = req.body; // "Accepted" or "Rejected"

  const contact = await Contact.findById(contactId);
  if (!contact || contact.receiver.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  contact.status = action;
  await contact.save();

  // ✅ Auto-create chat if accepted
  if (action === "Accepted") {
    const existingChat = await Chat.findOne({
      isGroupChat: false,
      users: { $all: [contact.sender, contact.receiver] },
    });
    if (!existingChat) {
      await Chat.create({
        users: [contact.sender, contact.receiver],
        isGroupChat: false,
      });
    }
  }

  res.json({ message: `Friend request ${action.toLowerCase()}` });
};

export const getContacts = async (req, res) => {
  const contacts = await Contact.find({
    $or: [{ sender: req.user._id }, { receiver: req.user._id }],
  })
    .populate("sender", "name email avatar")
    .populate("receiver", "name email avatar");

  res.json(contacts);
};
