import mongoose from "mongoose";

const sponsoredCollectionSchema = new mongoose.Schema(
  {
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: "Brand" },
    title: String,
    bannerUrl: String,
    startDate: Date,
    endDate: Date,
    fee: Number,
  },
  { timestamps: true }
);

export default mongoose.model("SponsoredCollection", sponsoredCollectionSchema);
