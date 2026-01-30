import mongoose, { Schema } from "mongoose";

const postSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    caption: {
      type: String,
      maxlength: 2200
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    isPublic: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    discriminatorKey: "postType"
  }
);

export const Post = mongoose.model("Post", postSchema);
