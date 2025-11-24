import { z } from "zod";
import {
  requiredString,
  slugSchema,
  emailSchema,
  phoneSchema,
  postalCodeSchema,
  zIndexSchema,
  plumbingConfigSchema,
  colorCodeSchema,
  optionalString,
  optionalUrlSchema,
  urlSchema,
} from "@/lib/validation";

/**
 * Admin schemas
 */
export const adminCreateSchema = z.object({
  fullName: requiredString,
  email: emailSchema,
  username: z.string().min(3, "Username must be at least 3 characters").transform((val) => val.trim()),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const adminUpdateSchema = adminCreateSchema.partial();

export const adminLoginSchema = z.object({
  username: requiredString,
  password: requiredString,
});

/**
 * User schemas
 */
export const userCreateSchema = z.object({
  fullName: requiredString,
  email: emailSchema,
  phoneNumber: phoneSchema,
  postalCode: postalCodeSchema,
});

export const userUpdateSchema = userCreateSchema.partial();

/**
 * Project Type schemas
 */
export const projectTypeCreateSchema = z.object({
  name: requiredString,
  slug: slugSchema,
});

export const projectTypeUpdateSchema = projectTypeCreateSchema.partial();

/**
 * Shower Type schemas
 */
export const showerTypeCreateSchema = z.object({
  name: requiredString,
  slug: slugSchema,
  projectTypeId: z.number().int().positive(),
  baseImage: optionalUrlSchema,
});

export const showerTypeUpdateSchema = showerTypeCreateSchema.partial();

/**
 * Template Category schemas
 */
export const templateCategoryCreateSchema = z.object({
  name: requiredString,
  slug: slugSchema,
  description: optionalString,
  isActive: z.boolean().optional().default(true),
});

export const templateCategoryUpdateSchema =
  templateCategoryCreateSchema.partial();

/**
 * Template Subcategory schemas
 */
export const templateSubcategoryCreateSchema = z.object({
  name: requiredString,
  slug: slugSchema,
  description: optionalString,
  templateCategoryId: z.number().int().positive(),
});

export const templateSubcategoryUpdateSchema =
  templateSubcategoryCreateSchema.partial();

/**
 * Template Product schemas
 */
export const templateProductCreateSchema = z.object({
  name: requiredString,
  slug: slugSchema,
  description: optionalString,
  thumbnailUrl: optionalUrlSchema,
  templateCategoryId: z.number().int().positive().optional(),
  templateSubcategoryId: z.number().int().positive().optional(),
});

export const templateProductUpdateSchema =
  templateProductCreateSchema.partial();

/**
 * Template Variant schemas
 */
export const templateVariantCreateSchema = z.object({
  colorName: requiredString,
  colorCode: colorCodeSchema,
  imageUrl: urlSchema,
  publicId: optionalString,
  templateProductId: z.number().int().positive(),
  plumbingConfig: plumbingConfigSchema,
});

export const templateVariantUpdateSchema =
  templateVariantCreateSchema.partial();

/**
 * Category schemas
 */
export const categoryCreateSchema = z.object({
  name: requiredString,
  slug: slugSchema,
  hasSubcategories: z.boolean().optional().default(false),
  showerTypeId: z.number().int().positive(),
  templateId: z.number().int().positive().optional(),
  z_index: zIndexSchema,
  plumbingConfig: plumbingConfigSchema,
});

export const categoryUpdateSchema = categoryCreateSchema.partial();

/**
 * Subcategory schemas
 */
export const subcategoryCreateSchema = z.object({
  name: requiredString,
  slug: slugSchema,
  categoryId: z.number().int().positive(),
  templateId: z.number().int().positive().optional(),
  z_index: zIndexSchema,
  plumbingConfig: plumbingConfigSchema,
});

export const subcategoryUpdateSchema = subcategoryCreateSchema.partial();

/**
 * Product schemas
 */
export const productCreateSchema = z.object({
  name: requiredString,
  slug: slugSchema,
  description: optionalString,
  thumbnailUrl: optionalUrlSchema,
  categoryId: z.number().int().positive(),
  subcategoryId: z.number().int().positive().optional(),
  templateId: z.number().int().positive().optional(),
  z_index: zIndexSchema,
  plumbingConfig: plumbingConfigSchema,
});

export const productUpdateSchema = productCreateSchema.partial();

/**
 * Product Variant schemas
 */
export const productVariantCreateSchema = z.object({
  colorName: requiredString,
  colorCode: colorCodeSchema,
  imageUrl: urlSchema,
  publicId: optionalString,
  productId: z.number().int().positive(),
  plumbing_config: plumbingConfigSchema,
  templateVariantId: z.number().int().positive().optional(),
});

export const productVariantUpdateSchema = productVariantCreateSchema.partial();

/**
 * User Design schemas
 */
export const userDesignCreateSchema = z.object({
  userFullName: optionalString,
  userEmail: emailSchema, // Required for saving designs
  userPhone: phoneSchema.optional(),
  userPostalCode: postalCodeSchema.optional(),
  designData: z.record(z.string(), z.unknown()),
  showerTypeId: z.number().int().positive(),
});

export const userDesignUpdateSchema = z.object({
  userFullName: optionalString,
  userPhone: phoneSchema.optional(),
  userPostalCode: postalCodeSchema.optional(),
  designData: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Project schemas
 */
export const projectCreateSchema = z.object({
  userId: z.string().uuid(),
  name: requiredString,
  selections: z.record(z.string(), z.unknown()),
});

export const projectUpdateSchema = projectCreateSchema.partial();

/**
 * Template instantiation schema
 */
export const templateInstantiateSchema = z.object({
  templateCategoryId: z.number().int().positive(),
  showerTypeId: z.number().int().positive(),
});

/**
 * Query parameter schemas
 */
export const showerTypeQuerySchema = z.object({
  projectTypeId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const categoryQuerySchema = z.object({
  showerTypeId: z.coerce.number().int().positive().optional(),
  includeProducts: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  forAdmin: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  plumbingConfig: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const productQuerySchema = z.object({
  categoryId: z.coerce.number().int().positive().optional(),
  subcategoryId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const variantQuerySchema = z.object({
  productId: z.coerce.number().int().positive(),
});
