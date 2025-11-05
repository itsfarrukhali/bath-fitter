// utils/plumbingProductHelper.ts

import { Product, ProductVariant } from "@/types/design";

/**
 * Gets the appropriate variant based on plumbing configuration and shower type
 */
export function getVariantForPlumbingConfig(
  variants: ProductVariant[],
  plumbingConfig: string,
  showerTypeId: number
): ProductVariant | undefined {
  const symmetricShowerTypes = [5, 8]; // Tub to Shower and Alcove
  const asymmetricShowerTypes = [6, 7]; // Curved and Neo Angle

  // If no variants, return undefined
  if (!variants || variants.length === 0) return undefined;

  // For symmetric shower types, return first available variant (no plumbing-specific logic)
  if (symmetricShowerTypes.includes(showerTypeId)) {
    return variants[0]; // Just return the first variant, no filtering needed
  }

  // For asymmetric shower types, find plumbing-specific variant
  if (asymmetricShowerTypes.includes(showerTypeId)) {
    const upperCasePlumbing = plumbingConfig.toUpperCase();

    // First, try to find exact plumbing match
    const exactMatch = variants.find(
      (variant) => variant.plumbing_config === upperCasePlumbing
    );

    if (exactMatch) {
      console.log(`Found exact plumbing match: ${exactMatch.plumbing_config}`);
      return exactMatch;
    }

    // If no exact match, try BOTH
    const bothMatch = variants.find(
      (variant) => variant.plumbing_config === "BOTH"
    );

    if (bothMatch) {
      console.log(`Found BOTH match: ${bothMatch.plumbing_config}`);
      return bothMatch;
    }

    // Fallback to first variant
    console.log(`Fallback to first variant: ${variants[0].plumbing_config}`);
    return variants[0];
  }

  // Default: return first variant
  return variants[0];
}

/**
 * Enhanced version that considers shower type symmetry
 */
export function getAppropriateVariant(
  product: Product,
  plumbingConfig: string,
  showerTypeId: number
): ProductVariant | undefined {
  const variants = product.variants || [];

  console.log(`Getting variant for: ${product.name}`);
  console.log(`Shower Type: ${showerTypeId}, Plumbing: ${plumbingConfig}`);
  console.log(
    `Available variants:`,
    variants.map((v) => ({
      id: v.id,
      plumbing: v.plumbing_config,
      color: v.colorName,
    }))
  );

  const selectedVariant = getVariantForPlumbingConfig(
    variants,
    plumbingConfig,
    showerTypeId
  );

  console.log(`Selected variant:`, selectedVariant);

  return selectedVariant;
}
