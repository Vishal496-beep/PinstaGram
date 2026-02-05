import { v2 as cloudinary } from "cloudinary";

const deleteFromCloudinary = async (public_id) => {
    try {
        if (!public_id) {
            console.warn("Delete aborted: No public_id provided");
            return null;
        }

        // Use resource_type: "image" if you are specifically deleting images, 
        // though "destroy" usually handles it automatically.
        const response = await cloudinary.uploader.destroy(public_id);
        
        return response;
    } catch (error) {
        console.error("Cloudinary delete error:", error.message || error);
        return null;
    }
};

export { deleteFromCloudinary };