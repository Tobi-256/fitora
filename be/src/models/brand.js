import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    logoUrl: String,
    website: String,
    contactEmail: String,
    commissionRate: { type: Number, default: 0.1 },
  },
  { timestamps: true }
);

export default mongoose.model("Brand", brandSchema);
