import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Video } from "../models/video.models.js"
import { Tweet } from "../models/tweet.models.js"
import { Photo } from "../models/photo.models.js"

const searchContext = asyncHandler(async(req, res) => {
   const { query, page = 1, limit = 10 } = req.query;

    if (!query || query.trim() === "") {
        throw new ApiError(400, "Query is required")
    }

    const searchRegex = new RegExp(query, "i")  //it means if user types n instead of N and in database it is saved in N  so when user types n it will show N
    //video aggregation
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const parsedLimit = parseInt(limit);
    const videoSearch = Video.find({
      $and: [
           {
                 $or: [
            {title: searchRegex},
            {description: searchRegex}         
        ],
        $or: [      
            { isPublic: true }, 
            { owner: req.user?._id }
        ]
    }
      ],
        isPublished: true
    })
    .sort({createdAt: -1})
    .skip(skip)
    .populate("owner", "username avatar fullname")
    .limit(parsedLimit)
//photo aggregation
    const photoSearch = Photo.find({
        $and: [
           {
        $or: [
            {title: searchRegex},
            {description: searchRegex}         
        ],
        $or: [      
            { isPublic: true }, 
            { owner: req.user?._id }
        ]
    }
      ],
    })
    .sort({createdAt: -1})
    .skip(skip)
    .popuplate("owner", "username avatar fullname")
    .limit(parsedLimit)
   //tweets aggregation
    const tweetSearch = Tweet.find(
        {content: searchRegex},
        {owner: req.user?._id || { $exist : true}} //tweets ki privacy k according 
    )
    .sort({createdAt: -1})
    .skip(skip)
    .populate("owner", "fullname avatar username")
    .limit(parsedLimit)

    //Promise.all to run all simultaniously
    const [videos, photos, tweets] = await Promise.all([
        videoSearch,
        photoSearch,
        tweetSearch
    ])

    const results = {
        videos,
        photos,
        tweets,
        stats: {
            videoCount: videos.length,
            photoCount: photos.length,
            tweetCount: tweets.length,
            totalFound: videos.length + photos.length + tweets.length
        }
    }

    return res
    .status(200)
    .json(new ApiResponse(200,results, "search results fetched successfully"))
})

export {
    searchContext
}