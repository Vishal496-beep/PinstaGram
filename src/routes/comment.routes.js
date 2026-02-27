import { Router } from 'express';
import { 
    getVideoComments, 
    getPhotoComment, 
    addComment, 
    updateComment, 
    deleteComment 
} from "../controllers/comments.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Apply security to all routes
router.use(verifyJWT);

// GET comments for Video or Photo
router.route("/v/:videoId").get(getVideoComments);
router.route("/p/:photoId").get(getPhotoComment);

// POST comment (Generic)
// Pattern: /api/v1/comments/v/:videoId OR /api/v1/comments/p/:photoId
router.route("/v/:videoId").post(addComment);
router.route("/p/:photoId").post(addComment);

// UPDATE and DELETE (By Comment ID)
router.route("/c/:commentId")
    .patch(updateComment)
    .delete(deleteComment);

export default router;