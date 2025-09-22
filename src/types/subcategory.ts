import { Product } from "./category";

// types/subcategory.ts
export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Subcategory {
  id: number;
  name: string;
  slug: string;
  categoryId: number;
  category: Category;
  createdAt?: Date;
  updatedAt?: Date;
  _count: {
    products: number;
  };
  products?: Product[]; // We can define a more specific type if needed
}

export interface SubcategoryCreateData {
  name: string;
  slug: string;
  categoryId: number;
}

export interface SubcategoryUpdateData {
  name?: string;
  slug?: string;
  categoryId?: number;
}

export interface SubcategoryResponse {
  success: boolean;
  data: Subcategory | Subcategory[];
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SubcategoryListResponse {
  message: string | undefined;
  success: boolean;
  data: Subcategory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
