import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {publishVideo, getAllVideos} from "../controllers/video.controllers.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router()
router.use(verifyJWT)
router
    .route("/")
    .get(getAllVideos)
    .post(
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
            
        ]),
        publishVideo
    );

export default router
