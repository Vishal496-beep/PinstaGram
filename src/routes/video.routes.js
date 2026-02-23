import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {publishVideo, getAllVideos, getVideoById, deleteVideo, updateVideo, togglePublishStatus} from "../controllers/video.controllers.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router()
router.use(verifyJWT)
router
    .route("/")
    .get(getAllVideos)
    .post(
        upload.fields([
            {
                name: "video",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
            
        ]),
        publishVideo
    );

    router.route("/:videoId")
    .get(verifyJWT, getVideoById)
    .delete(verifyJWT, deleteVideo)
    .patch(verifyJWT, updateVideo);
    router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus);

export default router
