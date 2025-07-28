
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: { type: String, enum: ["message", "friend_request", "group_invite"], required: true },
    content: { type: String }, // Optional: for custom messages
    isRead: { type: Boolean, default: false },
    link: { type: String }, // e.g., link to chat or profile
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
