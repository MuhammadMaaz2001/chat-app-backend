
import Contact from "../models/Contact.js";
import Chat from "../models/Chat.js";
import User from '../models/User.js';
import { getIO , onlineUsers} from "../socket/index.js";



export const sendFriendRequest = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const receiverUser = await User.findOne({ email: receiverId });

    if (!receiverUser) {
      return res.status(404).json({ message: "User not found" });
    }
   if (receiverUser.blockedUsers.includes(req.user._id)) {
  return res.status(403).json({ message: "You are blocked by this user" });
}

    // Prevent sending request to self
    if (receiverUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot send a request to yourself" });
    }

    // Check if request already exists in any direction
    const existing = await Contact.findOne({
      $or: [
        { sender: req.user._id, receiver: receiverUser._id },
        { sender: receiverUser._id, receiver: req.user._id },
      ]
    });

    // 🔄 Handle existing requests
    if (existing) {
      if (existing.status === "Accepted") {
        return res.status(400).json({ message: "You are already friends" });
      }

      if (
        existing.sender.toString() === receiverUser._id.toString() &&
        existing.receiver.toString() === req.user._id.toString() &&
        existing.status === "Pending"
      ) {
        // Reverse pending request exists, auto-accept it
        existing.status = "Accepted";
        await existing.save();

        // Optional: Create chat
        const existingChat = await Chat.findOne({
          isGroupChat: false,
          users: { $all: [existing.sender, existing.receiver] },
        });

        if (!existingChat) {
          await Chat.create({
            users: [existing.sender, existing.receiver],
            isGroupChat: false,
          });
        }

        // 🔔 Notify sender (original sender of pending request)
        const io = getIO();
        const socketId = onlineUsers.get(existing.sender.toString());
        if (socketId) {
          io.to(socketId).emit("friend-request-response", {
            contactId: existing._id,
            status: "Accepted",
            from: req.user._id,
          });
        }

        return res.status(200).json({ message: "Friend request auto-accepted", contact: existing });
      }

      // In other cases (already sent or rejected)
      return res.status(400).json({ message: `Request already ${existing.status.toLowerCase()}` });
    }

    // 🔹 If no existing request, create new one
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
  const { action } = req.body;

  const contact = await Contact.findById(contactId);
  if (!contact || contact.receiver.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  contact.status = action;
  await contact.save();

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

  // 🔔 Notify sender about response
  const io = getIO();
  const socketId = onlineUsers.get(contact.sender.toString());
  if (socketId) {
    io.to(socketId).emit("friend-request-response", {
      contactId,
      status: action,
      from: req.user._id,
    });
  }

  res.json({ message: `Friend request ${action.toLowerCase()}` });
}

// export const getContacts = async (req, res) => {
//   const contacts = await Contact.find({
//     $or: [
//       { sender: req.user._id },
//       { receiver: req.user._id }
//     ],isDeleted: false,
//     status: "Accepted",
    
//   })
//     .populate("sender", "name email avatar")
//     .populate("receiver", "name email avatar");

//   const friends = contacts.map(contact => {
//     const isSender = contact.sender._id.toString() === req.user._id.toString();
//     return isSender ? contact.receiver : contact.sender;
//   });

//   res.json(friends);
// };

export const getContacts = async (req, res) => {
  const contacts = await Contact.find({
    $or: [
      { sender: req.user._id },
      { receiver: req.user._id }
    ],
    status: "Accepted",
    isDeleted: false // ✅ Place this outside the `$or`
  })
    .populate("sender", "name email avatar")
    .populate("receiver", "name email avatar");

  const friends = contacts.map(contact => {
    const isSender = contact.sender._id.toString() === req.user._id.toString();
    return isSender ? contact.receiver : contact.sender;
  });

  res.json(friends);
};


export const getSentRequests = async (req, res) => {
  const sent = await Contact.find({ sender: req.user._id })
    .populate("receiver", "name email avatar")
    .sort({ createdAt: -1 });
  res.json(sent);
};

//  filter only Pending received requests
export const getReceivedRequests = async (req, res) => {
  const received = await Contact.find({
    receiver: req.user._id,
    status: "Pending",
  })
    .populate("sender", "name email avatar")
    .sort({ createdAt: -1 });

  res.json(received);
};
