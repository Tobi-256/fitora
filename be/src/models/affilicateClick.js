import mongoose from "mongoose";

const affiliateClickSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: "Brand" },
  },
  { timestamps: true }
);

export default mongoose.model("AffiliateClick", affiliateClickSchema);
