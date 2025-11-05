import { Category, Product } from "./category";
import { Subcategory } from "./subcategory";

// types/template.ts
export interface TemplateCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  templateSubcategories: TemplateSubcategory[];
  templateProducts: TemplateProduct[];
  categories: Category[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateSubcategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  templateCategoryId: number;
  templateCategory: TemplateCategory;
  templateProducts: TemplateProduct[];
  subcategories: Subcategory[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateVariant {
  id: number;
  colorName: string;
  colorCode?: string;
  imageUrl: string;
  publicId?: string;
  templateProductId: number;
  plumbingConfig: PlumbingConfig;
  templateProduct: TemplateProduct;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateProduct {
  id: number;
  name: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
  templateCategoryId?: number;
  templateSubcategoryId?: number;
  templateCategory?: TemplateCategory;
  templateSubcategory?: TemplateSubcategory;
  templateVariants: TemplateVariant[];
  products: Product[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateCreateData {
  name: string;
  slug: string;
  description?: string;
}

export interface TemplateInstanceCreateData {
  templateCategoryId: number;
  showerTypeIds: number[];
  customName?: string;
  plumbingOptions: PlumbingOptions; // NEW
}

export interface PlumbingOptions {
  createForLeft: boolean;
  createForRight: boolean;
  mirrorImages: boolean;
}

export enum PlumbingConfig {
  LEFT = "LEFT",
  RIGHT = "RIGHT",
  BOTH = "BOTH",
}

export interface InstantiationProgress {
  showerTypeId: number;
  showerTypeName: string;
  plumbingConfig: PlumbingConfig;
  status: "pending" | "processing" | "success" | "error";
  message?: string;
  categoryId?: number;
}

export interface InstantiationTask {
  id: string;
  templateId: number;
  templateName: string;
  progress: InstantiationProgress[];
  startedAt: Date;
  completedAt?: Date;
  status: "running" | "completed" | "failed";
  successCount: number;
  errorCount: number;
}
