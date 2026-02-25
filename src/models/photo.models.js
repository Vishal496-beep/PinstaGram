import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const photoSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    imageUrl: {
      type: String, // Cloudinary URL
      required: true
    },
    publicId: { // Crucial for deleting from Cloudinary later!
      type: String,
      required: true
    },
    caption: {
      type: String,
      maxlength: 2200
    },
    isPublic: {
      type: Boolean,
      default: true
    }
    // We removed likes/comments arrays to keep the document lean
  },
  { timestamps: true }
);
photoSchema.plugin(mongooseAggregatePaginate)
export const Photo = mongoose.model("Photo", photoSchema);
