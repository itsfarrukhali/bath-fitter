import { z } from "zod";
import { PlumbingConfig } from "@prisma/client";

/**
 * Common validation schemas
 */

// String validation with trimming
export const requiredString = z
  .string()
  .min(1, "This field is required")
  .transform((val) => val.trim());

export const optionalString = z
  .string()
  .nullable()
  .optional()
  .transform((val) => val?.trim() || undefined);

// Slug validation (lowercase, alphanumeric, hyphens)
export const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must be lowercase alphanumeric with hyphens"
  )
  .transform((val) => val.trim().toLowerCase());

// Email validation
export const emailSchema = z
  .string()
  .email("Invalid email address")
  .transform((val) => val.trim().toLowerCase());

// URL validation
export const urlSchema = z
  .string()
  .url("Invalid URL")
  .transform((val) => val.trim());

export const optionalUrlSchema = z
  .string()
  .url("Invalid URL")
  .nullable()
  .optional()
  .transform((val) => val?.trim() || undefined);

// Phone number validation (basic)
export const phoneSchema = z
  .string()
  .min(10, "Phone number must be at least 10 digits")
  .regex(/^[0-9+\s()-]+$/, "Invalid phone number format")
  .transform((val) => val.trim());

// Postal code validation
export const postalCodeSchema = z
  .string()
  .min(3, "Postal code must be at least 3 characters")
  .transform((val) => val.trim());

// Z-index validation (0-100)
export const zIndexSchema = z
  .number()
  .int("Z-index must be an integer")
  .min(0, "Z-index must be at least 0")
  .max(100, "Z-index must be at most 100")
  .optional()
  .nullable();

// Plumbing config validation
export const plumbingConfigSchema = z
  .nativeEnum(PlumbingConfig)
  .optional()
  .nullable();

// Color code validation (hex color)
export const colorCodeSchema = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color code")
  .nullable()
  .optional()
  .transform((val) => val?.toUpperCase() || undefined);

// Positive integer validation
export const positiveIntSchema = z
  .number()
  .int("Must be an integer")
  .positive("Must be a positive number");

// ID validation (for path parameters)
export const idParamSchema = z.string().regex(/^\d+$/, "Invalid ID format");

/**
 * Pagination schemas
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

/**
 * Validation helper functions
 */

/**
 * Validate and parse data with Zod schema
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, errors: result.error };
}

/**
 * Format Zod errors for API response
 */
export function formatZodErrors(
  error: z.ZodError
): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  error.issues.forEach((err: z.ZodIssue) => {
    const path = err.path.join(".");
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(err.message);
  });

  return formatted;
}

/**
 * Validate ID parameter from URL
 */
export function validateIdParam(id: string): number | null {
  const trimmed = id.trim();
  const parsed = parseInt(trimmed);
  
  // Check if it's a valid number, positive, and is an integer (no decimals)
  if (isNaN(parsed) || parsed <= 0 || trimmed !== parsed.toString()) {
    return null;
  }
  
  return parsed;
}

/**
 * Sanitize search query
 */
export function sanitizeSearchQuery(query: string | null): string | undefined {
  if (!query) return undefined;
  return query.trim().replace(/[<>]/g, "");
}

