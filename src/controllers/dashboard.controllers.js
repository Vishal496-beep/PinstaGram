import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.models.js"
import {Follower } from "../models/followers.models.js"
import {Like} from "../models/likes.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {Photo} from "../models/photo.models.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const  userId  = req.user?._Id
    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "invalid user id")
    }
    if (!userId) {
        throw new ApiError(400, "Unauthorized request")
    }
    const {videoStats, photoStats, followCount} = await Promise.all([
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
        Follower.countDocuments({profile: userId})
    ]);
    //merge result 
    const stats = {
            followers : followCount || 0,
            video: {
                total: videoStats[0]?.count || 0,
                views: videoStats[0]?.views || 0,
                likes: videoStats[0]?.totalLikes || 0
            },
            photo: {
                total: photoStats[0]?.count || 0,
                likes: photoStats[0]?.totalLikes || 0
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

    const [video, photo] = await Promise.all([
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
            {
                $addFields: {
                    likesCount: {$size: "$likes"},
                    type: "video"
               }
            },
            {
                $project: {
                    videoFile: 1, 
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
                    createdAt: 1
                }
            }
        ])
    ])
    const combinedList = [...video, ...photo]
    combinedList.sort((a, b) => b.createdAt - a.createdAt);
    return res.status(200).json(new ApiResponse(200, combinedList, "videos and photos fetched successfully"))
})

export {
    getChannelStats, 
    getChannelPhotoVideos
    }