import mongoose from "mongoose";

const analyticsEventSchema = new mongoose.Schema(
  {
    eventType: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  },
  { timestamps: true }
);

export default mongoose.model("AnalyticsEvent", analyticsEventSchema);
