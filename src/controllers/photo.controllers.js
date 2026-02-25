import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Photo } from "../models/photo.models.js"
import { deleteFromCloudinary } from "../utils/deleteCloud.js"
import mongoose, { isValidObjectId } from "mongoose"

const publishPhoto = asyncHandler(async(req, res) => {
    const { caption, isPublic } = req.body;
    const photoLocalPath = req.file?.path
    if (!photoLocalPath) {
        throw new ApiError(400, "photo file is missing")
    }
    const photo = await uploadOnCloudinary(photoLocalPath)
    if (!photo) {
        throw new ApiError(500, "something went wrong while uploading on cloudinary")
    }
    const image = await Photo.create({
        imageUrl: photo.url,
        publicId: photo.public_id,
        caption: caption || "",
        isPublic: isPublic !== "false",
        owner: req.user?._id
    })
    return res 
    .status(201)
    .json(new ApiResponse(201, image, "Photo published successfully"))
})

const getAllPhotos = asyncHandler(async(req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "asc", userId } = req.query;
    const filter = {
        isPublic: true
    }
    if (userId && mongoose.isValidObjectId(userId)) {
        filter.owner = new mongoose.Types.ObjectId(userId)
    }
    if(query){
        filter.caption = {$regex: query, $options: 'i'}
    }

    const photoAggregate = await Photo.aggregate([
        {$match: filter},
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
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
                owner: {
                    $first: "ownerDetails"
                }
            }
        },
        {
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        }
    ])
    
    const photo = await Photo.aggregatePaginate(photoAggregate, {
        page: parseInt(page),
        limit: parseInt(limit)
    })
    return res
    .status(200)
    .json(new ApiResponse(200, photo, "All photoes fetched successfully"))
})

const getPhotoById = asyncHandler(async(req, res) => {
    const {photoId} = req.params
    if (!mongoose.isValidObjectId(photoId)) {
        throw new ApiError(400, "Invalid photo id")
    }

    const photo = await Photo.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(photoId)
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
                        fullname: 1,
                        avatar: 1
                    }
                   }
                ]
            }
        },
        {
            $addFields: {
                owner: {$first: "$owner"}
            }
        }
    ])
    if (!photo?.length) {
        throw new ApiError(400, "photo not found")
    }

    return res.status(200)
    .json(new ApiResponse(200, photo, "Photo fetched successfully"))
})

const updatePhoto = asyncHandler(async(req, res) => {
    const { photoId } = req.params
    const { caption } = req.body
    if (!mongoose.isValidObjectId(photoId)) {
        throw new ApiError(400, "Invalid photo id")
    }
    const photo = await Photo.findById(photoId)
    if (!photo) {
        throw new ApiError(400, "Photo not found")
    }
   if (!photo.owner.equals(req.user?._id)) {
      throw new ApiError(400, "You do not have permissions to update")
   } 
    if (!caption?.length) {
        throw new ApiError(400, "caption is required")
    }
    let data = {}
    if (caption) data.caption = caption

    const updatedData = await Photo.findByIdAndUpdate(
        photoId, {
        $set: {
             caption
        }
      }, {new: true}
    )
    if (!updatedData?.length) {
        throw new ApiError(400, "caption is required for update")
    }
    return res.status(200).json(new ApiResponse(200, updatedData, "Photo updated successfully"))
})
const getUserPhotos = asyncHandler(async(req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id")
    }
    //Aggregation pipeline
    const photoAggregate = Photo.aggregate([
        //if someone else wants to access it or if the user themselves wants to 
        {
            $match: new mongoose.Types.ObjectId(userId),
            $or: [
                {isPublic: true},
                {owner: req.user?._id}
            ]
        },
        //latest photoes
        {
            $sort: {
                createdAt: -1
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
                            fullname: 1,
                            avatar: 1
                        }
                    }
                ]
             }
        },
        {
            $addFields: {
                owner: {$first: "$owner"}
            }
        }
    ])

    const photo = await Photo.aggregatePaginate(photoAggregate, {
        page: parseInt(page),
        limit: parseInt(limit)
    })

    return res.status(200).json(new ApiResponse(200, photo, "user pictures fetched successfully"))
})

const deletePhoto = asyncHandler(async(req, res) => {
    const { photoId } = req.params
    if (!mongoose.isValidObjectId(photoId)) {
        throw new ApiError(400, "Invalid photo id")
    }

    const photo = await Photo.findById(photoId)
    if (!photo) {
        throw new ApiError(400, "Photo not found")
    }
    // if user is the owner
    if (!photo.owner.equals(req.user?._id)) {
        throw new ApiError(400, "You do not have permissions to delete")
    }
       // delete from cloudinary
     await deleteFromCloudinary(photo.publicId)
     //delete id
     await Photo.findByIdAndDelete(photoId)

     return res
     .status(200)
     .json(new ApiResponse(200, {}, "photo deleted successfully"))
})
export {
    publishPhoto,
    getAllPhotos,
    getPhotoById,
    updatePhoto,
    getUserPhotos,
    deletePhoto
}