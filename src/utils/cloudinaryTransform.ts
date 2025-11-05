// utils/cloudinaryTransform.ts

/**
 * Applies horizontal flip transformation to Cloudinary URLs for right plumbing
 */
export function getPlumbingAdjustedImage(
  imageUrl: string,
  plumbingConfig: string | undefined,
  options: {
    quality?: number;
    format?: string;
    width?: number;
    height?: number;
  } = {}
): string {
  // If no plumbing config or left plumbing, return original URL
  if (!plumbingConfig || plumbingConfig === "left") {
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

    // Add horizontal flip for right plumbing
    if (plumbingConfig === "right") {
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
 *
 * Rules:
 * 1. NULL/BLANK -> Flip to Right (mirror horizontally)
 * 2. BOTH -> No flip (stay Left-sided)
 * 3. LEFT -> No flip (stay Left-sided)
 * 4. RIGHT -> No flip (stay Right-sided - already correct)
 */
export function transformCloudinaryUrl(
  imageUrl: string | undefined | null,
  plumbingConfig: string | undefined,
  variantPlumbingConfig?: string
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
  const shouldFlip = shouldFlipImage(plumbingConfig, variantPlumbingConfig);

  if (shouldFlip) {
    console.log(
      `🔄 Flipping image for plumbing: ${plumbingConfig}, variant: ${variantPlumbingConfig}`
    );
    return imageUrl.replace("/upload/", "/upload/a_hflip/");
  }

  // No flip needed
  return imageUrl;
}

/**
 * Core flipping logic based on PlumbingConfig rules
 */
export function shouldFlipImage(
  plumbingConfig: string | undefined,
  variantPlumbingConfig?: string
): boolean {
  // If no plumbing config selected, no flipping
  if (!plumbingConfig) {
    return false;
  }

  // Convert to uppercase for consistency
  const plumbing = plumbingConfig.toUpperCase();
  const variantPlumbing = variantPlumbingConfig?.toUpperCase();

  console.log(
    `🔧 Flipping Check: Plumbing=${plumbing}, Variant=${variantPlumbing}`
  );

  // Rule 1: User selected RIGHT plumbing configuration
  if (plumbing === "RIGHT") {
    // Flip only if variant is NULL, BLANK, or LEFT
    // (because these are uploaded as Left-sided and need mirroring for Right)
    if (!variantPlumbing || variantPlumbing === "LEFT") {
      return true;
    }

    // Don't flip if variant is BOTH or RIGHT
    // BOTH: Same image works for both sides
    // RIGHT: Already uploaded as Right-sided
    if (variantPlumbing === "BOTH" || variantPlumbing === "RIGHT") {
      return false;
    }
  }

  // Rule 2: User selected LEFT plumbing configuration
  // NEVER flip for left plumbing - all images should appear as uploaded
  if (plumbing === "LEFT") {
    return false;
  }

  // Default: No flip
  return false;
}

/**
 * For thumbnail images with optimized settings
 */
export function getThumbnailUrl(
  imageUrl: string,
  plumbingConfig?: string,
  variantPlumbingConfig?: string,
  size: { width: number; height: number } = { width: 200, height: 200 }
): string {
  const baseUrl = transformCloudinaryUrl(
    imageUrl,
    plumbingConfig,
    variantPlumbingConfig
  );

  if (!baseUrl.includes("res.cloudinary.com")) {
    return baseUrl;
  }

  // Add thumbnail optimizations
  return baseUrl.replace(
    "/upload/",
    `/upload/w_${size.width},h_${size.height},c_fill,q_auto,f_auto/`
  );
}
