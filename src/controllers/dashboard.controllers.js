import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.models.js"
import {Follower } from "../models/followers.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {Photo} from "../models/photo.models.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Tweet } from "../models/tweet.models.js"

const AUTHOR_LOOKUP = [
    {
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "author"
        }
    },
    {
        $addFields: {
            author: {$first: "$author"}
        }
    }
]

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId = req.user?._id
    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "invalid user id")
    }
    if (!userId) {
        throw new ApiError(400, "Unauthorized request")
    }
    const user = await User.findById(userId).select("fullname username avatar")
    if (!user) throw new ApiError(404, "Channel not found")
    const {videoStats, photoStats,tweetStats, followCount} = await Promise.all([
        //video status
        Video.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: "likes",  //look in likes
                    localField: "_id",   //match video id
                    foreignField: "video", //likes mein video m se
                    as: "allLikes"      // create a list of total likes
                }
            },
            {
                 $group: {
                     _id: null,
                     count: {$sum: 1},
                     views: {$sum: "$views"},
                     totalLikes: {$sum: {$size: "$allLikes"}}  //count list
                 }
            }
        ]),
        //2. photo Likes 
        Photo.aggregate([
              {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
                }
              },
              {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "photo",
                    as: "allLikes"
                }
              },
              {
                $group: {
                    _id: null,
                    count: {$sum: 1},
                    totalLikes: {$sum: {$size: "$allLikes"}}
                }
              }
        ]),
        // tweets likes
        Tweet.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "tweet",
                    as: "allLikes"
                }
            },
            {
                $group: {
                    id: null,
                    count: {$sum: 1},
                    views: {$sum: "$views"},
                    totalLikes: {$sum: {$size: "$allLikes"}}
                }
            }

        ]),
        Follower.countDocuments({profile: userId})
    ]);
    //merge result 
    const stats = {
            owner: user,
            followers : followCount || 0,
            video: {
                total: videoStats[0]?.count || 0,
                views: videoStats[0]?.views || 0,
                likes: videoStats[0]?.totalLikes || 0
            },
            photo: {
                total: photoStats[0]?.count || 0,
                likes: photoStats[0]?.totalLikes || 0
            },
            tweet: {
                total: tweetStats[0]?.count || 0,
                likes: tweetStats[0]?.likes || 0
            }
    }
    return res 
    .status(200)
    .json(new ApiResponse(200, stats, "Dashboard stats updated"))

})

const getChannelPhotoVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userId = req.user?._id
       if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "invalid user id")
    }
     if (!userId) {
        throw new ApiError(400, "Unauthorized request")
    }

    const [video, photo, tweet] = await Promise.all([
        //1. video aggregation
        Video.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "video",
                    as: "likes"
                }
            }, 
            ...AUTHOR_LOOKUP,
            {
                $addFields: {
                    likesCount: {$size: "$likes"},
                    type: "video"
               }
            },
            {
                $project: {
                    videoFile: 1, 
                    "author.fullname": 1,
                    "author.avatar": 1,
                    "author.username": 1,
                    thumbnail: 1,
                    views: 1,
                    likesCount: 1,
                    title: 1,
                    type: 1,
                    createdAt: 1
                }
            }
        ]),
        //2.Photo aggregation
        Photo.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "photo",
                    as: "likes"
                }
            },
             ...AUTHOR_LOOKUP,
            {
                $addFields: {
                     likesCount: {$size: "$likes"},
                    type: "photo"
                }
            },
            {
                $project: {
                    photo: 1, 
                    views: 1,
                    likesCount: 1,
                    title: 1,
                    type: 1,
                    createdAt: 1,
                    "author.fullname": 1,
                    "author.avatar": 1,
                    "author.username": 1

                }
            }
        ]), 
        // tweet aggregation
        Tweet.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                 $lookup: {
                    from : "likes",
                    localField: "_id",
                    foreignField: "tweet",
                    as: "likes"
                 }
            },
             ...AUTHOR_LOOKUP,
            {
                $addFields: {
                    likesCount: {$size: "$likes"},
                    type: "tweet"
                }
            },
            {
                 $project: {
                    content: 1,
                    likesCount: 1,
                    type: 1,
                    "author.fullname": 1,
                    "author.avatar": 1,
                    "author.username": 1,
                    createdAt: 1
                 }
            }
        ])
    ])
    const combinedList = [...video, ...photo, ...tweet]
    combinedList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.status(200).json(new ApiResponse(200, combinedList, "videos and photos fetched successfully"))
})

export {
    getChannelStats, 
    getChannelPhotoVideos
    }