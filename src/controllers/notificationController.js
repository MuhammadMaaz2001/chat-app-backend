
import Notification from "../models/Notification.js";

export const getNotifications = async (req, res) => {
  const filter = req.query.unread === "true" ? { isRead: false } : {};
  const notifications = await Notification.find({
    recipient: req.user._id,
    ...filter,
  }).sort({ createdAt: -1 });

  res.json(notifications);
};

export const markAsRead = async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notification) {
    return res.status(404).json({ message: "Notification not found" });
  }
  res.json(notification);
};
