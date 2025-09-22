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
  _count: {
    products: number;
  };
}

export interface Product {
  id: number;
  name: string;
  variants: ProductVariant[];
  _count: {
    variants: number;
  };
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
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

export interface CategoryCreateData {
  name: string;
  slug: string;
  hasSubcategories: boolean;
  showerTypeId: number;
}

export interface CategoryUpdateData {
  name?: string;
  slug?: string;
  hasSubcategories?: boolean;
  showerTypeId?: number;
}
