// types/subcategory.ts
import { Product } from "./category";

export interface Category {
  id: number;
  name: string;
  slug: string;
  z_index?: number | null;
}

export interface Subcategory {
  id: number;
  name: string;
  slug: string;
  categoryId: number;
  z_index?: number | null;
  category: Category;
  createdAt?: Date;
  updatedAt?: Date;
  _count: {
    products: number;
  };
  products?: Product[];
}

export interface SubcategoryCreateData {
  name: string;
  slug: string;
  categoryId: number;
  z_index?: number | null;
}

export interface SubcategoryUpdateData {
  name?: string;
  slug?: string;
  categoryId?: number;
  z_index?: number | null;
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
