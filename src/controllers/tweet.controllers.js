import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body
    const user = await User.findById(req.user?._id)
    if (!user) {
        throw new ApiError(400,"Invalid User")
    }
    if (!content || content.trim() === "" ) {
        throw new ApiError(400, "content is required for tweet")
    }

    const tweet = await Tweet.create({
       content,
       owner : req.user?._id
    })

   return res
   .status(200)
   .json(new ApiResponse(200,tweet, "tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user Id")
    }
    const tweet = await Tweet.aggregate(
        [
            {
                $match : new mongoose.Types.ObjectId(userId)
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerDetails",
                    pipeline: [{
                        $project: {
                            username: 1,
                            avatar: 1,
                            fullname: 1
                        }
                    }]
                }
            },
            {
                 $addFields: {
                    owenerDetails: {
                        $first: "$ownerDetails"
                    }
                 }
            },
            {
                $sort: {
                    createdAt: -1
                }
            }

        ]
    )

    if (!tweet) {
        throw new ApiError(400, "No tweets availible")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweets fetched successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}