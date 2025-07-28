import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

// Generate JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Register new user
export const registerUser = async (req, res) => {
  const { name, email, password, avatar } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) return res.status(400).json({ message: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashedPassword, avatar });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    token: generateToken(user._id),
  });
};

// Login user
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  const isMatch = user && (await bcrypt.compare(password, user.password));

  if (!user || !isMatch) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    token: generateToken(user._id),
  });
};

// Get current user
export const getProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.json(user);
};

export const logoutUser = (req, res) => {
  res.status(200).json({ message: "Logged out (client must clear token)" });
};


// Search users by name or email (excluding self)
export const searchUsers = async (req, res) => {
  const keyword = req.query.search;

  if (!keyword) return res.json([]);

  const regex = new RegExp(keyword, "i"); // case-insensitive search

  const users = await User.find({
    $or: [{ name: regex }, { email: regex }],
    _id: { $ne: req.user._id },
  }).select("-password");

  res.json(users);
};

// Send friend request
export const sendFriendRequest = async (req, res) => {
  const { targetUserId } = req.body;
  const senderId = req.user._id;

  if (targetUserId === senderId.toString()) {
    return res.status(400).json({ message: "Cannot add yourself." });
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) return res.status(404).json({ message: "User not found" });

  // Check if already exists
  const existing = targetUser.friendRequests.find(
    (req) => req.from.toString() === senderId.toString()
  );

  if (existing) return res.status(400).json({ message: "Request already sent" });

  targetUser.friendRequests.push({ from: senderId });
  await targetUser.save();

  res.status(200).json({ message: "Friend request sent" });
};

// Accept friend request
export const acceptFriendRequest = async (req, res) => {
  const senderId = req.body.senderId;
  const receiver = await User.findById(req.user._id);
  const sender = await User.findById(senderId);

  if (!receiver || !sender) return res.status(404).json({ message: "User not found" });

  const request = receiver.friendRequests.find((r) => r.from.toString() === senderId);
  if (!request) return res.status(400).json({ message: "No such request" });

  request.status = "accepted";
  receiver.contacts.push(senderId);
  sender.contacts.push(receiver._id);

  await receiver.save();
  await sender.save();

  res.json({ message: "Friend request accepted" });
};

// Reject friend request
export const rejectFriendRequest = async (req, res) => {
  const senderId = req.body.senderId;
  const receiver = await User.findById(req.user._id);

  receiver.friendRequests = receiver.friendRequests.filter(
    (r) => r.from.toString() !== senderId
  );

  await receiver.save();
  res.json({ message: "Friend request rejected" });
};

// List all accepted contacts
export const getContacts = async (req, res) => {
  const user = await User.findById(req.user._id).populate("contacts", "name email avatar");
  res.json(user.contacts);
};

// List all pending requests
export const getPendingRequests = async (req, res) => {
  const user = await User.findById(req.user._id).populate("friendRequests.from", "name email avatar");
  const pending = user.friendRequests.filter(r => r.status === "pending");
  res.json(pending);
};
