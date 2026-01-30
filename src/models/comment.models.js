import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    post: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "postType"
    },
    postType: {
      type: String,
      required: true,
      enum: ["Photo", "Video"]
    }
  },
  {
    timestamps: true
  }
);

export const Comment = mongoose.model("Comment", commentSchema);
