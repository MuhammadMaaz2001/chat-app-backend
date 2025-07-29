import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
  searchUsers ,
  // sendFriendRequest,
  // acceptFriendRequest,
  // rejectFriendRequest,
  // getContacts,
  blockUser,
  unblockUser,
  // getPendingRequests
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getProfile);
router.get("/", protect, searchUsers); 
router.post("/logout", logoutUser);
router.put("/block", protect, blockUser);
router.put("/unblock", protect, unblockUser);

// router.post("/friend-request", protect, sendFriendRequest);
// router.post("/friend-request/accept", protect, acceptFriendRequest);
// router.post("/friend-request/reject", protect, rejectFriendRequest);
// router.get("/contacts", protect, getContacts);
// router.get("/friend-requests", protect, getPendingRequests);


export default router;
