import { Category } from "./category";

// types/shower-type.ts
export interface ProjectType {
  id: number;
  name: string;
  slug: string;
}

export interface ShowerType {
  id: number;
  name: string;
  slug: string;
  projectTypeId: number;
  projectType: ProjectType;
  baseImage?: string;
  _count: {
    categories: number;
    UserDesign: number;
  };
  categories: Category[]; // We can define a more specific type if needed
}

export interface ShowerTypeCreateData {
  name: string;
  slug: string;
  projectTypeId: number;
  baseImage?: string;
}

export interface ShowerTypeUpdateData {
  name?: string;
  slug?: string;
  projectTypeId?: number;
  baseImage?: string;
}

export interface ShowerTypeResponse {
  success: boolean;
  data: ShowerType | ShowerType[];
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
