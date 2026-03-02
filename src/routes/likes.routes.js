import { Router } from 'express';
import {
   toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getAllLiked,
    togglePhotoLike
} from "../controllers/like.controllers.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/toggle/t/:tweetId").post(toggleTweetLike);
router.route("/v/p/t").get(getAllLiked);
router.route("/toggle/p/:photoId").post(togglePhotoLike)

export default router