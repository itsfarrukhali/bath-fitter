// types/products.ts
export enum PlumbingConfig {
  LEFT = "LEFT",
  RIGHT = "RIGHT",
  BOTH = "BOTH",
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
  _transformedImageUrl?: string;
  categoryId: number;
  subcategoryId?: number;
  z_index?: number | null;
  category: {
    id: number;
    name: string;
    slug: string;
    z_index?: number | null;
    showerType: {
      id: number;
      name: string;
      slug: string;
    };
  };
  subcategory?: {
    id: number;
    name: string;
    slug: string;
    z_index?: number | null;
  };
  variants: ProductVariant[];
  _count: {
    variants: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: number;
  colorName: string;
  colorCode?: string;
  imageUrl: string;
  _transformedImageUrl?: string;
  publicId?: string;
  productId: number;
  plumbing_config?: PlumbingConfig | null;
  product?: Product;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCreateData {
  name: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
  categoryId: number;
  subcategoryId?: number;
  z_index?: number | null;
}

export interface ProductUpdateData {
  name?: string;
  slug?: string;
  description?: string;
  thumbnailUrl?: string;
  categoryId?: number;
  subcategoryId?: number;
  z_index?: number | null;
}

export interface ProductResponse {
  success: boolean;
  data: Product | Product[];
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface VariantCreateData {
  colorName: string;
  colorCode?: string;
  imageUrl: string;
  publicId?: string;
  productId: number;
  plumbing_config?: PlumbingConfig | null;
}

export interface VariantUpdateData {
  colorName?: string;
  colorCode?: string;
  imageUrl?: string;
  publicId?: string;
  plumbing_config?: PlumbingConfig | null;
}
