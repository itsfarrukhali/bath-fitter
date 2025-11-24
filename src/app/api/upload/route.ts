import { NextRequest } from "next/server";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicId,
} from "@/lib/cloudinary";
import { CloudinaryUploadResponse } from "@/types/cloudinary";
import {
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";

// Allowed file types
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * POST /api/upload
 * Upload an image to Cloudinary
 * Supports replacing existing images
 * Requires authentication (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createUnauthorizedResponse();
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string;
    const existingImageUrl = formData.get("existingImageUrl") as string | null;

    // Validate file
    if (!file) {
      return createErrorResponse("No file provided", 400);
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return createErrorResponse(
        `Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(", ")}`,
        400
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return createErrorResponse(
        `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        400
      );
    }

    // Validate folder
    if (!folder || folder.trim() === "") {
      return createErrorResponse("Folder path is required", 400);
    }

    // Sanitize folder path (remove leading/trailing slashes, spaces)
    const sanitizedFolder = folder.trim().replace(/^\/+|\/+$/g, "");

    // Delete old image if exists
    if (existingImageUrl) {
      const publicId = extractPublicId(existingImageUrl);
      if (publicId) {
        try {
          await deleteFromCloudinary(publicId);
        } catch (error) {
          // Log but don't fail if old image deletion fails
          console.error("Failed to delete old image:", error);
        }
      }
    }

    // Upload new image using the helper function
    const result: CloudinaryUploadResponse = await uploadToCloudinary(
      file,
      sanitizedFolder
    );

    if (!result.success || !result.imageUrl || !result.publicId) {
      throw new Error("Cloudinary upload failed - invalid response");
    }

    return createSuccessResponse(
      {
        imageUrl: result.imageUrl,
        publicId: result.publicId,
        folder: sanitizedFolder,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      },
      "Image uploaded successfully",
      201
    );
  } catch (error) {
    return handleApiError(error, "POST /api/upload");
  }
}

/**
 * DELETE /api/upload
 * Delete an image from Cloudinary
 * Requires authentication (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authentication check
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createUnauthorizedResponse();
    }

    const body = await request.json();
    const { imageUrl } = body;

    // Validate imageUrl
    if (!imageUrl || typeof imageUrl !== "string" || imageUrl.trim() === "") {
      return createErrorResponse("Valid image URL is required", 400);
    }

    const publicId = extractPublicId(imageUrl);
    
    if (!publicId) {
      return createErrorResponse(
        "Could not extract public ID from image URL",
        400
      );
    }

    // Delete from Cloudinary
    await deleteFromCloudinary(publicId);

    return createSuccessResponse(
      { publicId, imageUrl },
      "Image deleted successfully"
    );
  } catch (error) {
    return handleApiError(error, "DELETE /api/upload");
  }
}
