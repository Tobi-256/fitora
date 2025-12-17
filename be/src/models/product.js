import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: String,
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: "Brand" },
    sizes: [String],
    model3DUrl: String,
    thumbnailUrl: String,
    partnerUrl: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
