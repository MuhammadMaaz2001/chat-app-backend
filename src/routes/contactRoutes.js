// src/routes/contactRoutes.js
import express from "express";
import { sendFriendRequest, respondToRequest, getContacts } from "../controllers/contactController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/send", protect, sendFriendRequest);
router.put("/respond/:contactId", protect, respondToRequest);
router.get("/", protect, getContacts);

export default router;
