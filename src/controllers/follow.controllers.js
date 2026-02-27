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
     follower: req.user?._id,  //the loggedin user
     profile: profileId
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
     follower: req.user?._id,
     profile: profileId
   })
   return res
   .status(200)
   .json(new ApiResponse(200, {isFollowing: true}, "Following successfully"))
})

// controller to return subscriber list of a channel
const getUserChannelFollowers = asyncHandler(async (req, res) => {
    const {profileId} = req.params
    if (!mongoose.isValidObjectId(profileId)) {
        throw new ApiError(400, "Invalid profile id")
    }

    const followers = await Follower.aggregate([
        {
            $match: {
                profile: new mongoose.Types.ObjectId(profileId)
            }
        }, 
        {
            $lookup: {
                from: "users",
                localField: "follower",
                foreignField: "_id",
                as: "followerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1,
                            fullname: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                followerDetails: {$first: "$followerDetails"}
            }
        },
        {
           $sort: {
             createdAt: -1
           }
        },
        {
            $project: {
                followerDetails: 1,
                createdAt: 1
            }
        }
    ])
    return res
    .status(200)
    .json(new ApiResponse(200, {followers, followerCount: followers.length}, "Followers fetched successfully"))
})

// controller to return channel list to which user has subscribed
const getFollowingChannels = asyncHandler(async (req, res) => {
    const { followerId } = req.params
    if (!mongoose.isValidObjectId(followerId)) {
        throw new ApiError(400, "invalid id")
    }

    let following = await Follower.aggregate([
        {
            $match: {
                follower : new mongoose.Types.ObjectId(followerId) 
            }
        }, 
        {
          $lookup : {
              from: "users",
              localField: "profile",
              foreignField: "_id",
              as: "followingDetails",
              pipeline: [
                {
                    $project: {
                        username: 1,
                        fullname: 1,
                        avatar: 1
                    }
                }
              ]

          }
        },
        {
            $addFields: {
                followingDetails: {$first: "$followingDetails"}
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                followingDetails: 1,
                createdAt: 1
            }
        }
    ])
    
    return res
    .status(200)
    .json(new ApiResponse(200, {following, followingCount: following.length}, "following fetched successfully"))
})

export {
    toggleFollow,
    getUserChannelFollowers,
    getFollowingChannels
}