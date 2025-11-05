// lib/cloudinary.ts
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from "cloudinary";
import { CloudinaryUploadResponse } from "@/types/cloudinary";
import { PlumbingConfig } from "@/types/template";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;

export const uploadToCloudinary = async (
  file: File,
  folder: string,
  options: {
    flipImage?: boolean;
    generateMirroredVersion?: boolean;
  } = {}
): Promise<CloudinaryUploadResponse> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Promise((resolve, reject) => {
      const uploadOptions: any = {
        folder: `bath-fitter/${folder}`,
        resource_type: "image",
        quality: "auto",
        fetch_format: "auto",
      };

      // Add flip transformation if requested
      if (options.flipImage) {
        uploadOptions.transformation = [{ effect: "mirror" }];
      }

      cloudinary.uploader
        .upload_stream(
          uploadOptions,
          (
            error: UploadApiErrorResponse | undefined,
            result: UploadApiResponse | undefined
          ) => {
            if (error) {
              reject(new Error(error.message));
            } else if (result) {
              const response: CloudinaryUploadResponse = {
                success: true,
                imageUrl: result.secure_url,
                publicId: result.public_id,
              };

              // If we need to generate mirrored version, upload again with flip
              if (options.generateMirroredVersion) {
                // This would need to be handled separately as it requires another upload
                console.log("Mirrored version generation would happen here");
              }

              resolve(response);
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

// Enhanced transformation functions with proper PlumbingConfig support
export function getPlumbingAdjustedImage(
  imageUrl: string,
  variantPlumbingConfig: PlumbingConfig,
  targetPlumbingConfig: PlumbingConfig,
  options: {
    quality?: number;
    format?: string;
    width?: number;
    height?: number;
  } = {}
): string {
  // If no transformation needed
  if (variantPlumbingConfig === targetPlumbingConfig) {
    return imageUrl;
  }

  // If variant is BOTH, no transformation needed
  if (variantPlumbingConfig === PlumbingConfig.BOTH) {
    return imageUrl;
  }

  // Only transform Cloudinary URLs
  if (!imageUrl.includes("res.cloudinary.com")) {
    console.warn("Non-Cloudinary URL detected:", imageUrl);
    return imageUrl;
  }

  try {
    const url = new URL(imageUrl);
    const pathSegments = url.pathname.split("/");

    // Find the 'upload' segment in Cloudinary URL
    const uploadIndex = pathSegments.findIndex(
      (segment) => segment === "upload"
    );

    if (uploadIndex === -1) {
      console.warn("Invalid Cloudinary URL structure:", imageUrl);
      return imageUrl;
    }

    // Build transformations array
    const transformations: string[] = [];

    // Add horizontal flip if we need to mirror between left and right
    if (
      (variantPlumbingConfig === PlumbingConfig.LEFT &&
        targetPlumbingConfig === PlumbingConfig.RIGHT) ||
      (variantPlumbingConfig === PlumbingConfig.RIGHT &&
        targetPlumbingConfig === PlumbingConfig.LEFT)
    ) {
      transformations.push("a_hflip"); // Horizontal flip
    }

    // Add optional transformations
    if (options.quality) {
      transformations.push(`q_${options.quality}`);
    }

    if (options.width && options.height) {
      transformations.push(`w_${options.width},h_${options.height},c_fill`);
    } else if (options.width) {
      transformations.push(`w_${options.width}`);
    } else if (options.height) {
      transformations.push(`h_${options.height}`);
    }

    if (options.format) {
      transformations.push(`f_${options.format}`);
    }

    // Insert transformations after 'upload'
    if (transformations.length > 0) {
      const transformationString = transformations.join(",");
      pathSegments.splice(uploadIndex + 1, 0, transformationString);
    }

    // Reconstruct URL
    url.pathname = pathSegments.join("/");
    return url.toString();
  } catch (error) {
    console.error("Error transforming Cloudinary URL:", error);
    return imageUrl; // Fallback to original URL
  }
}

/**
 * SMART IMAGE FLIPPING LOGIC based on PlumbingConfig
 */
export function shouldFlipImage(
  plumbingConfig: PlumbingConfig,
  variantPlumbingConfig: PlumbingConfig
): boolean {
  // Rule 1: User selected RIGHT plumbing configuration
  if (plumbingConfig === PlumbingConfig.RIGHT) {
    // Flip only if variant is LEFT (needs mirroring for Right)
    if (variantPlumbingConfig === PlumbingConfig.LEFT) {
      return true;
    }

    // Don't flip if variant is BOTH or RIGHT
    // BOTH: Same image works for both sides
    // RIGHT: Already uploaded as Right-sided
    if (
      variantPlumbingConfig === PlumbingConfig.BOTH ||
      variantPlumbingConfig === PlumbingConfig.RIGHT
    ) {
      return false;
    }
  }

  // Rule 2: User selected LEFT plumbing configuration
  // NEVER flip for left plumbing - all images should appear as uploaded
  if (plumbingConfig === PlumbingConfig.LEFT) {
    return false;
  }

  // Default: No flip
  return false;
}

export function transformCloudinaryUrl(
  imageUrl: string | undefined | null,
  targetPlumbingConfig: PlumbingConfig,
  variantPlumbingConfig: PlumbingConfig
): string {
  // Return placeholder if no image URL
  if (!imageUrl) {
    return "/images/placeholder.png";
  }

  // Only transform Cloudinary URLs
  if (!imageUrl.includes("res.cloudinary.com")) {
    return imageUrl;
  }

  // Determine if we should flip the image
  const shouldFlip = shouldFlipImage(
    targetPlumbingConfig,
    variantPlumbingConfig
  );

  if (shouldFlip) {
    console.log(
      `🔄 Flipping image for plumbing: ${targetPlumbingConfig}, variant: ${variantPlumbingConfig}`
    );
    return imageUrl.replace("/upload/", "/upload/a_hflip/");
  }

  // No flip needed
  return imageUrl;
}

/**
 * For thumbnail images with optimized settings
 */
export function getThumbnailUrl(
  imageUrl: string,
  targetPlumbingConfig?: PlumbingConfig,
  variantPlumbingConfig?: PlumbingConfig,
  size: { width: number; height: number } = { width: 200, height: 200 }
): string {
  let baseUrl = imageUrl;

  // Apply plumbing transformation if both configs are provided
  if (targetPlumbingConfig && variantPlumbingConfig) {
    baseUrl = transformCloudinaryUrl(
      imageUrl,
      targetPlumbingConfig,
      variantPlumbingConfig
    );
  }

  if (!baseUrl.includes("res.cloudinary.com")) {
    return baseUrl;
  }

  // Add thumbnail optimizations
  return baseUrl.replace(
    "/upload/",
    `/upload/w_${size.width},h_${size.height},c_fill,q_auto,f_auto/`
  );
}
