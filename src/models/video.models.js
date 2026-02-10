import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const videoSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    videoFile: {
      type: String,
      required: true
    },
    thumbnail: {
      type: String
    },
    title: {
      type: String,
      required: true,
      maxlength: 2200
    }, 
    description: {
      type: String, 
      required: true
      },
    duration: {
       type: Number,
       required: true
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
    views: {
      type: Number,
      default: 0
    },
    isPublic: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema);
