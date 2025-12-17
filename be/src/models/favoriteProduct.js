import mongoose from "mongoose";

const favoriteProductSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  },
  { timestamps: true }
);

export default mongoose.model("FavoriteProduct", favoriteProductSchema);
