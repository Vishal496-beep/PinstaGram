import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"




const getAllVideos = asyncHandler( async (req, res) => {
       const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
})










export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}