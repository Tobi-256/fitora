import mongoose from "mongoose";

const bodyProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },

    height: Number,
    weight: Number,
    shoulder: Number,
    chest: Number,
    waist: Number,
    hip: Number,
  },
  { timestamps: true }
);

export default mongoose.model("BodyProfile", bodyProfileSchema);
