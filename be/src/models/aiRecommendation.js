import mongoose from "mongoose";

const aiRecommendationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    recommendedProductIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    ],
    reason: String,
  },
  { timestamps: true }
);

export default mongoose.model("AIRecommendation", aiRecommendationSchema);
