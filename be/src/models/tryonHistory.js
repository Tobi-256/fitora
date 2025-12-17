import mongoose from "mongoose";

const tryOnHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    bodySnapshot: Object,
  },
  { timestamps: true }
);

export default mongoose.model("TryOnHistory", tryOnHistorySchema);
