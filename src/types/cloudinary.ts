export interface CloudinaryUploadResponse {
  success: boolean;
  imageUrl: string;
  publicId: string;
}

export interface CloudinaryUploadOptions {
  folder: string;
  resource_type?: "image" | "video" | "raw";
  quality?: string;
  fetch_format?: string;
}

export interface CloudinaryImage {
  id: number;
  url: string;
  publicId: string;
  variantId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CloudinaryUploadResult {
  secure_url: any;
  public_id: string;
  url?: string;
}

export interface UploadResponse {
  success: boolean;
  imageUrl?: string;
  publicId?: string;
  message?: string;
}
