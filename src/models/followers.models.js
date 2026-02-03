import mongoose,{Schema, Types} from "mongoose";

const folowerSchema = new Schema(
    {
      follower: {
      type: Schema.Types.ObjectId, //one who is following
      ref: "User" 
      },
      profile: {
        type: Schema.Types.ObjectId, //one to whom is "follower" is "following"
        ref: "User" 
      }

    },
    {timestamps: true}
)

export const Follower = mongoose.model("Follower", folowerSchema)