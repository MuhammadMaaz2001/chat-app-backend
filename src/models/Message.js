import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    content: {
      type: String,
      trim: true,
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
    },
    isDeleted: { type: Boolean, default: false },

    mediaUrl: {
  type: [String],
  default: "",
}

  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
