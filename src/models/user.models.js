import mongoose,{ Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
    {
         
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6
    },
    avatar: {
      type: String, // Cloudinary / S3 URL
      required: true
    },
    bio: {
      type: String,
      maxlength: 150
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video"
      }
    ],
    refreshToken: {
      type: String
    }
  },
  {
    timestamps: true
  }
);
    

userSchema.pre("save", async function (next){
  if (!this.isModified("password")) return next()
   this.password = await bcrypt.hash(this.password, 10)
   next()
})

userSchema.methods.isPasswordCorrect = async function(password){
   return await bcrypt.compare(password, this.password)
}

export const User = mongoose.model("User", userSchema)