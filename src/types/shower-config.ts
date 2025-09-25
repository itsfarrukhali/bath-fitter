// types/shower-config.ts
export interface ProjectType {
  id: number;
  name: string;
  slug: string;
  description?: string;
  baseImage?: string;
}

export interface ShowerType {
  id: number;
  name: string;
  slug: string;
  description?: string;
  baseImage?: string;
  projectTypeId: number;
  projectType: ProjectType;
}

export interface PlumbingConfig {
  id: string;
  name: string;
  description: string;
  image: string;
}

export interface ShowerConfiguration {
  projectTypeId?: number;
  projectTypeName?: string;
  showerTypeId?: number;
  showerTypeName?: string;
  plumbingConfig?: string;
}
