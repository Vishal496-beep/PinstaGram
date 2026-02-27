import { Router } from 'express';
import {
   toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
    togglePhotoLike
} from "../controllers/like.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/toggle/t/:tweetId").post(toggleTweetLike);
router.route("/videos").get(getLikedVideos);
router.route("/toggle/p/: photoId").post(togglePhotoLike)

export default router