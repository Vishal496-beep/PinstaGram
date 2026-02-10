import { Router } from "express";
import { getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, changeCurrentPassword, updateAccountDetails, getUserChannelProfile, getWatchHistory } from "../controllers/user.controllers.js";
import { updateUserAvatar } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router()
router.route("/register").post(
    upload.fields([
        {
            name: 'avatar',
            maxCount: 1
        }
    ]),
    registerUser
)
// Add .none() to handle text-only form-data
router.route("/login").post(upload.none(), loginUser);

//secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/changePassword").post(verifyJWT, changeCurrentPassword)
router.route("/currentUser").post(verifyJWT, getCurrentUser)
router.route("/update-Details").patch(verifyJWT, updateAccountDetails)
// user.routes.js
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)

export default router