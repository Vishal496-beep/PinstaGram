import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/likes.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid video id")
    }
    const isAlreadyLiked = await Like.findOne({
        video: videoId,
        likedBy: req.user?._id
    })
    if (isAlreadyLiked) {
        //UNLIKE video
        await Like.findByIdAndDelete(isAlreadyLiked?._id)
        return res
        .status(200)
        .json(new ApiResponse(200, {isLiked: false}, "Unliked video successfully"))
    }
    //Like video
    await Like.create({
        video: videoId,
        likedBy: req.user?._id
    })
    return res
    .status(200)
    .json(new ApiResponse(200, {isLiked: true}, "Video liked successfully"))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id")
    }

    const alreadyLiked = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id
    })
    if (alreadyLiked) {
        //Unlike comment
        await Like.findByIdAndDelete(alreadyLiked?._id)
        return res
        .status(200)
        .json(new ApiResponse(
            200,
            {isLiked: false},
            "Comment disliked successfully"
        ))
    }
    //Like comment
    await Like.create({
        comment: commentId,
        likedBy: req.user?._id
    })

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {isLiked: true},
        "Comment liked Successfully"
    ))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    if (!mongoose.isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id")
    }
    let isAlreadyLiked = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id
    })
    if (isAlreadyLiked) {
        // unlike tweet
        await Like.findByIdAndDelete(isAlreadyLiked?._id)
        return res
        .status(200)
        .json(new ApiResponse(200, {isLiked: false}, "Tweet Unliked Successfully"))
    }
    // like tweet
    await Like.create({
        tweet: tweetId,
        likedBy: req.user?._id
    })
     return res
        .status(200)
        .json(new ApiResponse(200, {isLiked: true}, "Tweet liked Successfully"))
    
}
)
const togglePhotoLike = asyncHandler(async(req, res) => {
    //TODO: toggle like on photo
    const {photoId} = req.params
    if (!mongoose.isValidObjectId(photoId)) {
        throw new ApiError(400, "Invalid photo id")
    }
    let isAlreadyLiked = await Like.findOne({
        photo: photoId,
        likedBy: req.user?._id
    })
    if (isAlreadyLiked) {
        // unlike tweet
        await Like.findByIdAndDelete(isAlreadyLiked?._id)
        return res
        .status(200)
        .json(new ApiResponse(200, {isLiked: false}, "photo Unliked Successfully"))
    }
    // like tweet
    await Like.create({
        photo: photoId,
        likedBy: req.user?._id
    })
     return res
        .status(200)
        .json(new ApiResponse(200, {isLiked: true}, "photo liked Successfully"))
    
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
     const allLikes = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    {
                        $project: {
                             videoFile: 1, thumbnail: 1, title: 1, duration: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "comment",
                foreignField: "_id",
                as: "comment",
                pipeline: [
                    {
                        $project: {
                            owner: 1, content: 1
                        }
                    }
                ]
            }
        },
        {
             $lookup: {
                from: "tweets",
                localField: "tweet",
                foreignField: "_id",
                as: "tweet",
                pipeline: [
                    {
                        $project: {
                            owner: 1, content: 1
                        }
                    }
                ]
             }
        },
        {
            $lookup: {
                from: "photos",
                localField: "photo",
                foreignField: "_id",
                as: "photo"
            }
        },
        //Convert arrays into single objects
        {
            $addFields: {
                 video: {$first: "$video"},
                 tweet: {$first: "$tweet"},
                 comment: {$first: "$comment"},
                 photo: {$first: "$photo"}
            }
        },
        {
            $project: {
                _id: 1,
                type: {
                    $cond: [
                        "$video", "video",
                       {$cond: ["$comment", "comment", {
                          $cond: ["$tweet", "tweet", "photo"]
                       }]}
                    ]
                },
                content: {
                    $coalesce: ["$video", "$comment", "$photo", "$tweet"]
                },
                createdAt: 1
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        }
     ])

     return res.status(200).json(new ApiResponse(200, allLikes, "all liked items fetched successfully"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
    togglePhotoLike
}