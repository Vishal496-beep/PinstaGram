import { Router } from 'express';
import { searchContext } from "../controllers/search.controllers.js"; // File path check kar lena
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Sabhi search requests ke liye user logged in hona chahiye (optional)
router.use(verifyJWT); 

router.route("/query").get(searchContext);

export default router;