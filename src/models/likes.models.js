import mongoose,{Schema} from "mongoose";

const likesSchema = new Schema(
    {
       video: {
          type: Schema.Types.ObjectId,
          ref: "Video"
       },
       photo: {
          type: Schema.Types.ObjectId,
          ref: "Photo"
       },
       post: {
          type: Schema.Types.ObjectId,
          ref: "Post"
       }
    }, {timestamps: true}
)

export const Like = mongoose.model("Like", likesSchema)