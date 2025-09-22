import { ShowerType } from "./shower-types";

// types/project-type.ts
export interface ProjectType {
  id: number;
  name: string;
  slug: string;
  createdAt?: Date;
  updatedAt?: Date;
  _count: {
    showerTypes: number;
  };
  showerTypes?: ShowerType[]; // We can define a more specific type if needed
}

export interface ProjectTypeCreateData {
  name: string;
  slug: string;
}

export interface ProjectTypeUpdateData {
  name?: string;
  slug?: string;
}

export interface ProjectTypeResponse {
  success: boolean;
  data: ProjectType | ProjectType[];
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProjectTypeListResponse {
  message: string | undefined;
  success: boolean;
  data: ProjectType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
