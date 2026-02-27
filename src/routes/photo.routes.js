import { Router } from 'express';
import { 
    publishPhoto,
        getAllPhotos,
        getPhotoById,
        updatePhoto,
        getUserPhotos,
        deletePhoto
} from "../controllers/photo.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Sabhi photo routes ke liye login hona zaroori hai
router.use(verifyJWT); 

router.route("/")
    .get(getAllPhotos) // Public photos fetch karne ke liye
    .post(
        upload.fields([
            {
                name: "photoFile",
                maxCount: 1,
            }
        ]),
        uploadPhoto
    );

router.route("/:photoId")
    .get(getPhotoById)
    .delete(deletePhoto)
    .patch(updatePhoto);

// --- COMMENT ROUTES FOR PHOTOS ---

router.route("/c/:photoId")
    .get(getUserPhotos) // user photo 
    .get(getPhotoComment) // Photo ke comments dekhne ke liye
    .post(addComment);    // Photo par comment karne ke liye

export default router;