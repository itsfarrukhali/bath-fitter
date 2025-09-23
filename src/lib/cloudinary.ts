import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from "cloudinary";
import { CloudinaryUploadResponse } from "@/types/cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;

export const uploadToCloudinary = async (
  file: File,
  folder: string
): Promise<CloudinaryUploadResponse> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: `bath-fitter/${folder}`,
            resource_type: "image",
            quality: "auto",
            fetch_format: "auto",
          },
          (
            error: UploadApiErrorResponse | undefined,
            result: UploadApiResponse | undefined
          ) => {
            if (error) {
              reject(new Error(error.message));
            } else if (result) {
              resolve({
                success: true,
                imageUrl: result.secure_url,
                publicId: result.public_id,
              });
            } else {
              reject(new Error("Unknown error occurred"));
            }
          }
        )
        .end(buffer);
    });
  } catch (error) {
    throw new Error(
      `Upload failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result !== "ok") {
      throw new Error(`Failed to delete image: ${result.result}`);
    }
  } catch (error) {
    throw new Error(
      `Delete failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const extractPublicId = (url: string): string | null => {
  try {
    const matches = url.match(
      /upload\/(?:v\d+\/)?(.+?)\.(?:jpg|png|jpeg|webp)/i
    );
    return matches ? matches[1] : null;
  } catch {
    return null;
  }
};
