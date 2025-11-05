export interface DesignConfiguration {
  projectTypeId?: number;
  showerTypeId?: number;
  plumbingConfig?: string;
  showerTypeName?: string;
}

export interface Category {
  description: string;
  id: number;
  name: string;
  slug: string;
  hasSubcategories: boolean;
  showerTypeId: number;
  z_index?: number;
  showerType: {
    id: number;
    name: string;
    slug: string;
  };
  subcategories: Subcategory[];
  products: Product[];
}

export interface Subcategory {
  id: number;
  name: string;
  slug: string;
  z_index?: number;
  categoryId: number;
  products: Product[];
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
  _transformedImageUrl?: string;
  imageUrl: string;
  z_index?: number;
  categoryId: number;
  category?: Category;
  subcategory?: Subcategory;
  subcategoryId?: number;
  variants: ProductVariant[];
}

export interface ProductVariant {
  id: number;
  colorName: string;
  colorCode?: string;
  imageUrl: string;
  plumbing_config?: "LEFT" | "RIGHT" | "BOTH";
  productId: number;
  _transformedImageUrl?: string;
}

export interface SelectedProduct {
  product: Product;
  variant?: ProductVariant;
  categoryId: number;
  subcategoryId?: number;
  imageUrl?: string;
  _transformedImageUrl?: string;
}

export interface ConfiguratorState {
  configuration: DesignConfiguration;
  categories: Category[];
  selectedCategory: Category | null;
  selectedSubcategory: Subcategory | null;
  selectedProducts: { [key: string]: SelectedProduct };
  baseImage: string;
}

export interface SessionConfig {
  projectTypeId?: number;
  projectTypeName?: string;
  showerTypeId?: number;
  plumbingConfig?: "left" | "right";
  // add more fields as needed
}
