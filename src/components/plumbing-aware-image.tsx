// components/plumbing-aware-image.tsx
"use client";

import { transformCloudinaryUrl } from "@/utils/cloudinaryTransform";
import { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";

interface PlumbingAwareImageProps extends Omit<ImageProps, "src"> {
  src: string;
  alt: string;
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

  const [imgSrc, setImgSrc] = useState(imageUrl || "/images/placeholder.png");

  useEffect(() => {
    setImgSrc(imageUrl || "/images/placeholder.png");
  }, [imageUrl]);

  return (
    <Image
      src={imgSrc}
      onError={() => {
        setImgSrc("/images/shower-base-main-tub-to-shower-right.png");
      }}
      {...props}
    />
  );
}
