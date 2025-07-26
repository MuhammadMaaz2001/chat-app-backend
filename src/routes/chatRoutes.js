import express from "express";
import { accessChat, getChats } from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, accessChat);  // Access or create chat
router.get("/", protect, getChats);     // Get user’s chats

export default router;
