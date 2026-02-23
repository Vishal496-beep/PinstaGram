import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.models.js"
import { Follower } from "../models/followers.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleFollow = asyncHandler(async (req, res) => {
    const {profileId} = req.params
    // TODO: toggle subscription
    if (!mongoose.isValidObjectId(profileId)) {
        throw new ApiError(400, "Invalid profile id")
    }
    //making sure user do not follow tthemselves
   if (profileId === req.user?._id.toString()) {
      throw new ApiError(400, "You cannot follow yourself")
   }
   const isAlreadyFollowing = await Follower.findOne({
     Follower: req.user?._id,  //the loggedin user
     profileId: profileId
   })
   if (isAlreadyFollowing) {
    //if user wants to UNFOLLOW
      await Follower.findByIdAndDelete(isAlreadyFollowing._id)
         return res
         .status(200)
         .json(new ApiResponse(200, {isFollowing: false}, "Unfollowed successfully"))
   }
   //if user wants to FOLLOW
   await Follower.create({
     Follower: req.user?._id,
     profileId: profileId
   })
   return res
   .status(200)
   .json(new ApiResponse(200, {isFollowing: true}, "Following successfully"))
})

// controller to return subscriber list of a channel
const getUserChannelFollowers = asyncHandler(async (req, res) => {
    const {profileId} = req.params
})

// controller to return channel list to which user has subscribed
const getFollowingChannels = asyncHandler(async (req, res) => {
    const { followerId } = req.params
})

export {
    toggleFollow,
    getUserChannelFollowers,
    getFollowingChannels
}