import express from "express";
import { sendMessage, getMessages } from "../controllers/messageController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";


const router = express.Router();
router.post("/", protect, upload.array("images", 5), sendMessage);
// router.post("/", protect, upload.single("image"), sendMessage);
// router.post("/", protect, sendMessage);
router.get("/", protect, getMessages); // expects ?chatId=xxx&page=1

export default router;
