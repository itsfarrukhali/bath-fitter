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

  // If unoptimized is true, we should ensure Cloudinary optimizes the image
  // since Next.js won't be doing it
  const finalUrl =
    props.unoptimized &&
    imageUrl?.includes("res.cloudinary.com") &&
    !imageUrl.includes("q_auto")
      ? imageUrl.replace("/upload/", "/upload/q_auto,f_auto/")
      : imageUrl;

  const [imgSrc, setImgSrc] = useState(finalUrl || "/images/placeholder.png");

  useEffect(() => {
    setImgSrc(finalUrl || "/images/placeholder.png");
  }, [finalUrl]);

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
