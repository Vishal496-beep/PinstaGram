import { Router } from 'express';
import { 
    getVideoComments, 
    getPhotoComment, 
    addComment, 
    getTweetComments,
    updateComment, 
    deleteComment 
} from "../controllers/comments.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Apply security to all routes
router.use(verifyJWT);

router.route("/v/:videoId").get(getVideoComments);
router.route("/p/:photoId").get(getPhotoComment);
router.route("/t/:tweetId").get(getTweetComments);

// Adding Comments (Same controller, different params)
router.route("/v/:videoId").post(addComment);
router.route("/p/:photoId").post(addComment);
router.route("/t/:tweetId").post(addComment);

// Modify/Delete (Comment ID based)
router.route("/c/:commentId").patch(updateComment).delete(deleteComment);

export default router;
