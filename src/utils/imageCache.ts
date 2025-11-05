// utils/imageCache.ts

import { transformCloudinaryUrl } from "./cloudinaryTransform";

const imageCache = new Map<string, string>();

export function getCachedTransformedUrl(
  originalUrl: string,
  plumbingConfig: string | undefined
): string {
  const cacheKey = `${originalUrl}-${plumbingConfig}`;

  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!;
  }

  const transformedUrl = transformCloudinaryUrl(originalUrl, plumbingConfig);
  imageCache.set(cacheKey, transformedUrl);

  return transformedUrl;
}

// Clear cache when plumbing config changes
export function clearImageCache(): void {
  imageCache.clear();
}
