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
    .get(getAllPhotos) 
    .post(
        upload.fields([
            {
                name: "photoFile", // Make sure controller uses this same name
                maxCount: 1,
            }
        ]),
        publishPhoto // Fix: Match with import name above
    );

router.route("/:photoId")
    .get(getPhotoById)
    .patch(upload.single("photoFile"), updatePhoto) // If updating image, add multer
    .delete(deletePhoto);
router.route("/user/:userId").get(getUserPhotos); 


export default router;