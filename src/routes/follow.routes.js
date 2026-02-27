import { Router } from 'express';
import { 
    toggleFollow, 
    getUserChannelFollowers, 
    getFollowingChannels 
} from "../controllers/follower.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Saare routes ko protect karne ke liye
router.use(verifyJWT); 

// Toggle follow/unfollow using profileId
router.route("/c/:profileId").post(toggleFollow);

// Kisi channel ke followers dekhne ke liye
router.route("/followers/:profileId").get(getUserChannelFollowers);

// Ek user kis-kis ko follow kar raha hai wo dekhne ke liye
router.route("/following/:followerId").get(getFollowingChannels);

export default router;