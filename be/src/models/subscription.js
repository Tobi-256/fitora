import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    plan: { type: String, enum: ["free", "premium"], default: "free" },
    startDate: Date,
    endDate: Date,
    status: String,
  },
  { timestamps: true }
);

export default mongoose.model("Subscription", subscriptionSchema);
