// components/plumbing-aware-image.tsx
"use client";

import { transformCloudinaryUrl } from "@/utils/cloudinaryTransform";
import Image, { ImageProps } from "next/image";

interface PlumbingAwareImageProps extends Omit<ImageProps, "src"> {
  src: string;
  plumbingConfig?: string;
  variantPlumbingConfig?: string;
  enableFlip?: boolean;
}

export function PlumbingAwareImage({
  src,
  plumbingConfig,
  variantPlumbingConfig,
  enableFlip = true,
  ...props
}: PlumbingAwareImageProps) {
  // Apply smart flipping logic
  const imageUrl = enableFlip
    ? transformCloudinaryUrl(src, plumbingConfig, variantPlumbingConfig)
    : src;

  return (
    <Image
      src={imageUrl || "/images/placeholder.png"}
      onError={(e) => {
        e.currentTarget.src = "/images/placeholder.png";
      }}
      {...props}
    />
  );
}
