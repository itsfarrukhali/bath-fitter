// types/category.ts
export interface ShowerType {
  id: number;
  name: string;
  slug: string;
}

export interface Subcategory {
  id: number;
  name: string;
  slug: string;
  z_index?: number | null;
  _count: {
    products: number;
  };
  products?: Product[];
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
  categoryId: number;
  z_index?: number | null;
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
  colorCode: string;
  imageUrl: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  hasSubcategories: boolean;
  showerTypeId: number;
  z_index?: number | null;
  showerType: ShowerType;
  subcategories: Subcategory[];
  products: Product[];
  _count: {
    subcategories: number;
    products: number;
  };
}

export interface CategoryResponse {
  success: boolean;
  data: Category[];
  pagination?: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    totalItems?: number;
  };
  message?: string;
}

export interface CategoryCreateData {
  name: string;
  slug: string;
  z_index?: number | null;
  templateId?: number;
  hasSubcategories: boolean;
  showerTypeId: number;
}

export interface CategoryUpdateData {
  name?: string;
  slug?: string;
  z_index?: number | null;
  hasSubcategories?: boolean;
  showerTypeId?: number;
}
