import express from "express";
import { accessChat, getChats, createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup, deleteGroupChat ,unfriendUser  } from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, accessChat);  // Access or create chat
router.get("/", protect, getChats);     // Get user’s chats
router.post("/group", protect, createGroupChat);
router.put("/rename", protect, renameGroup);
router.put("/groupadd", protect, addToGroup);
router.put("/groupremove", protect, removeFromGroup);
router.delete("/:chatId", protect, deleteGroupChat); // DELETE /api/chats/:chatId
router.delete("/unfriend/:userId", protect, unfriendUser); // DELETE /api/contacts/unfriend/:userId


export default router;
