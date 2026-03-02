import { Router } from 'express';
import {
    getChannelStats, 
    getChannelPhotoVideosTweets
} from "../controllers/dashboard.controllers.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/stats").get(getChannelStats);
router.route("/p/v/t").get(getChannelPhotoVideosTweets);

export default router