import express from "express";
import { accessChat, getChats, createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup, } from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, accessChat);  // Access or create chat
router.get("/", protect, getChats);     // Get user’s chats
router.post("/group", protect, createGroupChat);
router.put("/rename", protect, renameGroup);
router.put("/groupadd", protect, addToGroup);
router.put("/groupremove", protect, removeFromGroup);
export default router;
