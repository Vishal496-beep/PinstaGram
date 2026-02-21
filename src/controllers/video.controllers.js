import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Video } from "../models/video.models.js"
import { deleteFromCloudinary } from "../utils/deleteCloud.js"



const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    const pipeline = [];

    // 1. Search Query logic
    if (query) {
        pipeline.push({
            $match: {
                $or: [
                    { title: { $regex: query, $options: "i" } },
                    { description: { $regex: query, $options: "i" } }
                ]
            }
        });
    }

    // 2. User Filter logic
    if (userId) {
        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId) 
            }
        });
    }

    // 3. Lookup Owner Details
    pipeline.push({
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "ownerDetails",
            // If you want to project specific fields, it's easier to use a $project stage after this
        }
    },
    {
        $unwind: "$ownerDetails" // Converts the ownerDetails array into an object
    },
    {
        $project: {
            videoFile: 1,
            thumbnail: 1,
            title: 1,
            description: 1,
            duration: 1,
            views: 1,
            isPublished: 1,
            ownerDetails: {
                username: 1,
                fullName: 1,
                avatar: 1
            }
        }
    });

    // 4. Sort logic
    if (sortBy && sortType) {
        pipeline.push({
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        });
    } else {
        pipeline.push({ $sort: { createdAt: -1 } });
    }

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    // Use the aggregate object directly
    const videoAggregate = Video.aggregate(pipeline);
    const videoList = await Video.aggregatePaginate(videoAggregate, options);

    return res
        .status(200)
        .json(new ApiResponse(200, videoList, "videos fetched successfully"));
});

const publishVideo = asyncHandler(async(req, res) => {
    const { title, description} = req.body
     if ([title, description].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "title and description are required")
     }

     const videoLocalFile = req.files?.video[0]?.path
     const thumbnailLocalFile = req.files?.thumbnail[0]?.path

     if (!videoLocalFile) {
        throw new ApiError(400, "video file is required")
     }
     if (!thumbnailLocalFile) {
        throw new ApiError(400, "thumbnail is required")
     }

     const videoFile = await uploadOnCloudinary(videoLocalFile)
     const thumbnail = await uploadOnCloudinary(thumbnailLocalFile)
    if (!videoFile || !videoFile.url) {
    throw new ApiError(500, "Cloudinary upload failed - Check server logs")
}
      
     const video = await Video.create({
         title,
         description,
         videoFile: videoFile.url,
         thumbnail: thumbnail.url,
         duration: videoFile.duration,
         owner: req.user?._id,
         isPublished: true
     })

     return res
     .status(200)
     .json(new ApiResponse(200, video, "video published successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
   const { videoId } = req.params
   if (!mongoose.isValidObjectId(videoId)) {
       throw new ApiError(400, "invalid video id format")
   }
  
  await Video.findByIdAndUpdate(
    videoId,
     {
        $inc: {$views : 1}}
    , {new : true}
)

   const video = await Video.aggregate([
      {
      $match : new mongoose.Schema.Types.ObjectId(videoId)
      },
      //join owner and subscribers count

      {
        $lookup: {
            from: "owner",
            localField: "owner",
            foreignField: "_id",
            as: "owner", 
            pipeline: [
                {
                      $project : {
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
                owner: { $first: "$owner" }
            }
      }
   ])
   if (!video?.length) {
      throw new ApiError(400, "Video not found")
   }
    
   

   return res.status(200).json(new ApiResponse(200, video, "video fetched successfully"))
})

const  updateVideo = asyncHandler(async (req, res) => {
    //update video details like title, description
     const { videoId } = req.params
     const {title, description} = req.body
     if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id")
     }
     if (!title && !description) {
         throw new ApiError(400, "at least one field is required")
     }

     const updatedVideo = await Video.findByIdAndUpdate(videoId, {
        $set : {
            title,
            description
        }
       },{new : true}
    )
    if (!updateVideo.length) {
        throw new ApiError(400, "Title or description are required for updating")
        
    }

    return res.status(200).json(200,updatedVideo, "video updated successfully" )

})

const deleteVideo = asyncHandler(async (req, res) => {
   const { videoId } = req.params
   if (!mongoose.isValidObjectId(videoId)) {
     throw new ApiError(400, "Invalid video Id")
   }  
    const vid = await Video.isValidObjectId(videoId) 
    if (!vid) {
        throw new ApiError(400, "video not found")
    }
    
    if (!Video.owner.equals(req.user?._id)) {
        throw new ApiError(403, "You do not have permissions to delete this video")
    }

    const videoDeleted = await deleteFromCloudinary(Video.videoFile, "video")
    if (!videoDeleted) {
        throw new ApiError(500, "Error while deleting files from Cloudinary")
    }

    await Video.findByIdAndDelete(videoId)

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async(req, res) => {
    const {videoId} = req.params
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid video id")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(400, "video not found")
    }

    if (!Video.owner.equals(req.user?._id)) {
        throw new ApiError(400, "Unauthorized to change Pusblish status")
    }
    video.isPublished = !video.isPublished
    await video.save({validateBeforeSave : false})

    return res
    .status(200).
    json(new  ApiResponse(200,{ isPublished: video.isPublished }, 
                `Video is now ${video.isPublished ? "Public" : "Private"}`) )
})

export {
    getAllVideos,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}