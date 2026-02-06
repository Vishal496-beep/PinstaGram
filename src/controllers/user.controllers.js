import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import fs from "fs"
import { deleteFromCloudinary } from "../utils/deleteCloud.js"
import mongoose from "mongoose"

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId)

    if (!user) {
      throw new ApiError(404, "User not found while generating tokens")
    }

    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken }
  } catch (error) {
    console.error("TOKEN ERROR:", error)
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    )
  }
}

const registerUser = asyncHandler( async (req, res) => {
     //get uaerdata through frontend  we can take it from postman like we have in user.model.js file
    //validation - not empty
    // check if user already exists: username,email
    // check for images ,check for avatar
    // upload them on cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return response

     const {fullname, email, username, password} = req.body
     
     if (
          [fullname, email, username, password].some((fields) => fields?.trim() === "")
     ) {
         throw new ApiError(400, "All fields are required")  
     }
       
     const existedUser = await User.findOne({
          $or: [{ username }, { email }]
       })
     if (existedUser) {
         throw new ApiError(409, "User with username or email already exists ") 
     }
     const avatarLocalFilePath = req.files?.avatar[0]?.path;
     if (!avatarLocalFilePath) {
          throw new ApiError(400, "Avatar file is required")
     }
     const avatar = await uploadOnCloudinary(avatarLocalFilePath)
     if (!avatar) {
          throw new ApiError(400, "Avatar file is required")
     }

     const user = await User.create({
          fullname,
          avatar : avatar.url,
          email,
          password,
          username: username.toLowerCase()
     })

     const createdUser = await User.findById(user._id).select(
          "-password -refreshToken"
     )
     if (!createdUser) {
          throw new ApiError(500, "Something went wrong while registering the user")
     }
    return res.status(201).json(
     new ApiResponse(200, createdUser, "User registered successfully")
    )
})

let loginUser = asyncHandler( async (req, res) => {
    const {username, email, password} = req.body

    if (!(username || email)) {
       throw new ApiError(400, "username or email is required")
    }
    
    const user = await User.findOne({
     $or: [{username}, {email}]
    })
    if (!user) {
       throw new ApiError(404, "user does not exists")
    }
    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid user credentials")
    }
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
      httpOnly: true,
       secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
          200,
          {
               user: loggedInUser, refreshToken, accessToken
          },
          "user logged In successfully"
      )
    )

})

let logoutUser = asyncHandler( async (req, res) => {
    await User.findByIdAndUpdate(
     req.user._id,
      {
          $unset: {
             refreshToken: 1
          }     
      },
      {
          new: true
     }
)
     const options = {
      httpOnly: true,
      secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken",  options)
    .json(new ApiResponse(200, {}, "user logged out"))
})

let refreshAccessToken = asyncHandler( async (req, res) => {
    const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
      throw new ApiError(401, "unauthorized request")
    }
    try {
     const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
     
     const user = await User.findById(decodedToken?._id)
     
     if (!user) {
       throw new ApiError(401, "Invalid refresh token")
     }
 
     if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "refresh token is expired or used")
     }
 
     const options = {
       httpOnly: true,
       secure: true
     }
 
     const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)
 
     return res
     .status(200)
     .cookie("accessToken", accessToken, options)
     .cookie("refreshToken", newRefreshToken, options)
     .json(
      new ApiResponse(
           200,
           {accessToken, refreshToken : newRefreshToken},
           "Access token refreshed successfully"
      )
     )
    } catch (error) {
       throw new ApiError(401, error?.message || "invalid refreshhhh token")
    }

})

const changeCurrentPassword = asyncHandler( async (req, res) => {
    const {oldPassword, newPassword} = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "invalid password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})
    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler( async (req, res) => {
    return res
    .json(new ApiResponse(200, req.user, "current user fetched successfully" ))
})

const updateAccountDetails = asyncHandler( async (req, res) => {
  const {fullname, email, username} = req.body
  if (!fullname || !email || !username) {
     throw new ApiError(400, "All fields are required")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email,
        username
      }
    },
    {new: true}
  ).select("-password")
  return res
  .status(200)
  .json(new ApiResponse(200, user, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }
  const user = await User.findById(req.user?._id)
    const oldAvatarUrl = user?.avatar

    if (oldAvatarUrl) {
        // Extract publicId from URL (usually the part after the last slash and before the extension)
        const publicId = oldAvatarUrl.split("/").pop().split(".")[0];
        await deleteFromCloudinary(publicId);
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedUser, "Avatar image updated successfully")
    )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
   const {username} = req.params
   if (!username?.trim()) {
      throw new ApiError(400, "username is missing")
   }

   const channel = await User.aggregate([
        {
              $match: {
                username: username?.toLowerCase()
              }
        },
        {
              $lookup: {
                 from: "Follower",
                 localField: "_id",
                 foreignField: "profile",
                 as: "Followers"
              }
        },
        {
              $lookup: {
                 from: "Follower",
                 localField: "_id",
                 foreignField: "follower",
                 as: "Following"
              }
        },
        {
               $addFields: {
                  followersCount: {
                     $size: "$Followers"
                  },
                  profileFollowingToCount: {
                     $size: "$Following"
                  },
                  isFollowing: {
                     $cond: {
                       if: {$in: [req.user?._id, "$Followers.follower"]},
                       then: true,
                       else: false
                     }
                  }
               },
        },
        {
                 $project: {
                   avatar: 1,
                   fullname: 1,
                   username: 1,
                   followersCount: 1,
                   profileFollowingToCount: 1,
                   isFollowing: 1
                 }
        }
   ])
   console.log('channel', channel);
   if (!channel?.length) {
      throw new ApiError(400, "channel does not exists")
   }

   return res
   .status(200)
   .json(new ApiResponse(200, channel[0], "User channel fetched successfully"))
   
})

const getWatchHistory = asyncHandler( async (req, res) => {
     const user = await User.aggregate([
        {
            $match: {
                 _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
               from: "Videos",
               localField: "watchHistory",
               foreignField: "_id",
               as: "watchHistory",
               pipeline: [
                 {
                     $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner",
                        pipeline: [
                           {
                              $project: {
                                  fullname: 1,
                                  username: 1,
                                  avatar: 1
                              }
                           },
                           {
                             $addFields: {
                               owner: {
                                 $first: "$owner"
                               }
                             }
                           }
                        ]
                     }
                 }
               ]
            }
        }
     ])

     return res
     .status(200)
     .json(new ApiResponse(
      200, 
      user[0].watchHistory,
       "watched history fetched successfully"))
})

export {
     registerUser,
     loginUser,
     logoutUser,
     refreshAccessToken,
     changeCurrentPassword,
     getCurrentUser,
     updateAccountDetails,
     updateUserAvatar,
     getUserChannelProfile,
     getWatchHistory 
}