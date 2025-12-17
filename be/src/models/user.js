import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isPremium: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
