import mongoose from "mongoose";

const adminLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: String,
    target: String,
  },
  { timestamps: true }
);

export default mongoose.model("AdminLog", adminLogSchema);
