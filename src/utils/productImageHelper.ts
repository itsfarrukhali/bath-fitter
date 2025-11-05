// utils/productImageHelper.ts

import { Product, ProductVariant } from "@/types/design";

/**
 * Gets the appropriate image URL for a product
 * Priority: variant image > product image > product thumbnail > placeholder
 */
export function getProductImageUrl(
  product: Product,
  variant?: ProductVariant
): string {
  // Priority order:
  // 1. Selected variant image
  // 2. Product's main image
  // 3. Product's thumbnail
  // 4. Placeholder
  return (
    variant?.imageUrl ||
    product.imageUrl ||
    product.thumbnailUrl ||
    "/images/placeholder.png"
  );
}

/**
 * Gets thumbnail URL for a product
 */
export function getProductThumbnailUrl(product: Product): string {
  return product.thumbnailUrl || "/images/placeholder.png";
}
