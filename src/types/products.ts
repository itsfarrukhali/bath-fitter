// types/product.ts
export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
  categoryId: number;
  subcategoryId?: number;
  category: {
    id: number;
    name: string;
    slug: string;
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
  publicId?: string;
  productId: number;
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
}

export interface ProductUpdateData {
  name?: string;
  slug?: string;
  description?: string;
  thumbnailUrl?: string;
  categoryId?: number;
  subcategoryId?: number;
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
