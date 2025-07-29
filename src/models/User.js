import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
//     friendRequests: [
//   {
//     from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//         to: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

//     status: {
//       type: String,
//       enum: ["pending", "accepted", "rejected"],
//       default: "pending",
//     },
//   },
// ],
blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

contacts: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
],

  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
