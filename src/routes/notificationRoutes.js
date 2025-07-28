
import express from "express";
import {
  getNotifications,
  markAsRead,
} from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getNotifications); // get all (optional ?unread=true)
router.patch("/:id/read", protect, markAsRead);

export default router;
