import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (file) => {
  try {
    const result = await cloudinary.uploader.upload(file);
    return result.secure_url;
  } catch (error) {
    console.error("cloudinary upload error:", error?.message || error);
    throw new Error("image upload failed");
  } finally {
    try {
      await fs.promises.unlink(file);
    } catch {
      // ignore cleanup errors (file may not exist)
    }
  }
};

export default uploadOnCloudinary ;
