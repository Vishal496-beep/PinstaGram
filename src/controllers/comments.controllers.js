import mongoose, {isValidObjectId} from "mongoose"
import {Comment} from "../models/comment.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.models.js"
import {Photo} from "../models/photo.models.js"
const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }
    const video = await Video.findById(videoId)
    if (!video.isPublished && !video.owner.equals(req.user?._id)) {
        throw new ApiError(403, "Unauthorized access")
    }

    const commentAggregate = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId),
                $or: [
                    {isPublished: true},
                    {owner: req.user?._id}
                ]
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
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
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes"
            }
        },
        {
            $addFields: {
                owner: {$first: "$owner"},
                likesCount: {$size: "$likes"},
                isLiked: {
                    $cond: {
                        if: {$in: [req.user?._id, "$likes.likedBy"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                likes: 0
            },
        },
        {
            $sort: {
                createdAt: -1
            }
        }
    ])

    const comments = await Comment.aggregatePaginate(commentAggregate, {
        page: parseInt(page, 1),
        limit: parseInt(limit, 10)
    })

    return res.status(200).json(new ApiResponse(200, comments, "comments fetched successfully"))
    
})

const getPhotoComment = asyncHandler(async(req, res) => {
        const { photoId } = req.params
        const { page = 1, limit = 10 } = req.query
        if (!mongoose.isValidObjectId(photoId)) {
            throw new ApiError(400, "Invalid photo id")
        }
        const photo = await Photo.findById(photoId)
        if (!photo.isPublic && !photo.owner.equals(req.user?._id)) {
            throw new ApiError(403, "Unauthorized access for photo comment")
        }

        const comment =  Comment.aggregate([
            {
                $match: {
                    photo: new mongoose.Types.ObjectId(photoId),
                    $or: [
                        {isPublic: true},
                        {owner: req.user?._id}
                    ]
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                avatar: 1,
                                username: 1,
                                fullname: 1
                            }
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "comment",
                    as: "likes"
                }
            },
            {
             $addFields: {
                owner: { $first: "$owner" },
                likesCount: { $size: "$likes" },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "$likes.likedBy"] },
                        then: true,
                        else: false
                    }
                }
            }
            },
            {
                $project: {likes: 0}
            },
            {
                $sort: {createdAt: -1}
            }
        ])
       
        const comments = await Comment.aggregatePaginate(comment, {
            page: parseInt(page, 1),
            limit: parseInt(limit, 10)
        })
    
        return res
        .status(200)
        .json(new ApiResponse(200, comments, "comments fetched successfully"))
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video, photo
    const { videoId, photoId } = req.params; // both parameters check 
    const { content } = req.body;
    if(!content) throw new ApiError(400, "content is required")
    let commentData = {
       content : content,
       owner: req.user?._id
     }
     if (videoId) {
        if (!mongoose.isValidObjectId(videoId)) throw new ApiError(400, "Invalid video Id")
             const video = await Video.findById(videoId)
        if(!video) throw new ApiError(404, "video not found")
            commentData.video = videoId
     } else if(photoId) {
        if(!mongoose.isValidObjectId(photoId)) throw new ApiError(400, "Invalid Photo id")
            const photo = await Photo.findById(photoId)
        if(!photo) throw new ApiError(404, "Photo not found")
            commentData.photo = photoId
     } else {
       throw new ApiError(400, "Target {video or photo} not found")
    }

    const comment = await Comment.create(commentData)
    return res 
    .status(201)
    .json(new ApiResponse(201, comment, "Comment added successfully"))

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
   const {commentId } = req.params
   const {content} = req.body
   if (!mongoose.isValidObjectId(commentId)) {
      throw new ApiError(400, "Invalid comment id")
   }
   if (!content || content.trim() === "") {
      throw new ApiError(400, "Content is required for updating comment")
   }
   
   const comment  = await Comment.findById(commentId)
   if (!comment) {
      throw new ApiError(400, "comment not found")
   }
   if (!comment.owner.equals(req.user?._id)) {
     throw new ApiError(403, "Unauthorized access to update comment")
   }

   const updatedComment = await Comment.findByIdAndUpdate(
    commentId, 
    {
       $set: {
        content: content
       }
   }, 
   {new : true}
)

  return res
  .status(200)
  .json(new ApiResponse(200, updatedComment, "Comment updated successfully"))

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params

    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id")
    }
    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(400, "comment not found")
    }
    let parentContent;
     if (comment.video) {
        parentContent = await Video.findById(comment.video)
     } else if (comment.photo) {
         parentContent = await Photo.findById(comment.photo)
     }
     const isCommentOwner = comment.owner.equals(req.user?._id)
     const isContentOwner = parentContent?.owner.equals(req.user?._id)
     if (!isCommentOwner && !isContentOwner) {
        throw new ApiError(403, "You are not authorized to delete this comment")
     }
     await Comment.findByIdAndDelete( commentId )

    return res.status(200).json(new ApiResponse(200, {}, "comment deleted successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment,
    getPhotoComment
}