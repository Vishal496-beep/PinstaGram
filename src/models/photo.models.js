import mongoose, { Schema } from "mongoose";

const photoSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    imageUrl: {
      type: String,
      required: true
    },
    caption: {
      type: String,
      maxlength: 2200
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "Like"
      }
    ],
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment"
      }
    ],
    isPublic: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export const Photo = mongoose.model("Photo", photoSchema);
