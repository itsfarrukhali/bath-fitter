import { NextRequest } from "next/server";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PlumbingConfig } from "@prisma/client";
import { getPlumbingAdjustedImage } from "@/lib/cloudinary";
import {
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/api-response";
import { handleApiError, NotFoundError } from "@/lib/error-handler";
import { z } from "zod";
import { validateData } from "@/lib/validation";

/**
 * Zod schema for template instantiation request
 */
const instantiateSchema = z.object({
  templateCategoryId: z.number().int().positive(),
  showerTypeIds: z.array(z.number().int().positive()).min(1),
  customName: z.string().optional(),
  plumbingOptions: z.object({
    createForLeft: z.boolean(),
    createForRight: z.boolean(),
    mirrorImages: z.boolean().default(false),
  }),
});



interface InstantiationResult {
  showerTypeId: number;
  plumbingConfig: PlumbingConfig;
  success: boolean;
  message?: string;
  categoryId?: number;
}

/**
 * POST /api/templates/instantiate
 * Instantiate a template category for specific shower types
 * Creates categories, subcategories, products, and variants based on template
 * Supports LEFT/RIGHT plumbing configurations with optional image mirroring
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createUnauthorizedResponse();
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = validateData(instantiateSchema, body);

    if (!validation.success) {
      throw validation.errors;
    }

    const { templateCategoryId, showerTypeIds, customName, plumbingOptions } =
      validation.data;

    // Validate plumbing options
    if (!plumbingOptions.createForLeft && !plumbingOptions.createForRight) {
      return createErrorResponse(
        "At least one plumbing option (LEFT or RIGHT) must be selected",
        400
      );
    }

    // Get the template with all its relationships
    const template = await prisma.templateCategory.findUnique({
      where: { id: templateCategoryId },
      include: {
        templateSubcategories: {
          include: {
            templateProducts: {
              include: {
                templateVariants: true,
              },
            },
          },
        },
        templateProducts: {
          include: {
            templateVariants: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundError("Template category");
    }

    const results: InstantiationResult[] = [];

    // Process each shower type
    for (const showerTypeId of showerTypeIds) {
      const showerType = await prisma.showerType.findUnique({
        where: { id: showerTypeId },
      });

      if (!showerType) {
        results.push({
          showerTypeId,
          plumbingConfig: PlumbingConfig.LEFT,
          success: false,
          message: "Shower type not found",
        });
        continue;
      }

      // Create categories for each selected plumbing configuration
      const plumbingConfigs: PlumbingConfig[] = [];
      if (plumbingOptions.createForLeft)
        plumbingConfigs.push(PlumbingConfig.LEFT);
      if (plumbingOptions.createForRight)
        plumbingConfigs.push(PlumbingConfig.RIGHT);

      for (const plumbingConfig of plumbingConfigs) {
        try {
          // Check if category already exists
          const existingCategory = await prisma.category.findFirst({
            where: {
              templateId: templateCategoryId,
              showerTypeId: showerTypeId,
              plumbingConfig: plumbingConfig,
            },
          });

          if (existingCategory) {
            results.push({
              showerTypeId,
              plumbingConfig,
              success: false,
              message: `Template already instantiated for ${
                showerType.name
              } with ${plumbingConfig.toLowerCase()} plumbing`,
            });
            continue;
          }

          // Create category instance
          const categoryName = customName || template.name;
          const category = await prisma.category.create({
            data: {
              name: `${categoryName} - ${plumbingConfig.toLowerCase()}`,
              slug: `${template.slug}-${plumbingConfig.toLowerCase()}`,
              templateId: template.id,
              showerTypeId: showerTypeId,
              plumbingConfig: plumbingConfig,
              hasSubcategories: template.templateSubcategories.length > 0,
              z_index: 50, // Default z_index
            },
          });

          // Create subcategories and products
          await createTemplateInstances(
            template,
            category.id,
            plumbingConfig,
            plumbingOptions.mirrorImages
          );

          results.push({
            showerTypeId,
            plumbingConfig,
            success: true,
            categoryId: category.id,
            message: `Successfully instantiated for ${showerType.name}`,
          });
        } catch (error) {
          console.error(
            `Error creating instance for ${showerType.name} - ${plumbingConfig}:`,
            error
          );
          results.push({
            showerTypeId,
            plumbingConfig,
            success: false,
            message: `Failed to create ${plumbingConfig.toLowerCase()} plumbing instance`,
          });
        }
      }
    }

    // Check if any succeeded
    const successCount = results.filter((r) => r.success).length;
    const totalCount = results.length;

    return createSuccessResponse(
      results,
      `Template instantiation completed: ${successCount}/${totalCount} successful`,
      201
    );
  } catch (error) {
    return handleApiError(error, "POST /api/templates/instantiate");
  }
}

/**
 * Helper function to create template instances
 * Creates subcategories and products based on template structure
 */
async function createTemplateInstances(
  template: {
    templateSubcategories: Array<{
      id: number;
      name: string;
      slug: string;
      templateProducts: Array<{
        id: number;
        name: string;
        slug: string;
        description: string | null;
        thumbnailUrl: string | null;
        templateVariants: Array<{
          id: number;
          colorName: string;
          colorCode: string | null;
          imageUrl: string;
          publicId: string | null;
          plumbingConfig: PlumbingConfig;
        }>;
      }>;
    }>;
    templateProducts: Array<{
      id: number;
      name: string;
      slug: string;
      description: string | null;
      thumbnailUrl: string | null;
      templateVariants: Array<{
        id: number;
        colorName: string;
        colorCode: string | null;
        imageUrl: string;
        publicId: string | null;
        plumbingConfig: PlumbingConfig;
      }>;
    }>;
  },
  categoryId: number,
  targetPlumbingConfig: PlumbingConfig,
  mirrorImages: boolean
) {
  // Create subcategory instances
  for (const templateSubcategory of template.templateSubcategories) {
    const subcategory = await prisma.subcategory.create({
      data: {
        name: templateSubcategory.name,
        slug: templateSubcategory.slug,
        templateId: templateSubcategory.id,
        categoryId: categoryId,
        plumbingConfig: targetPlumbingConfig,
        z_index: 50, // Default z_index
      },
    });

    // Create product instances for subcategory
    for (const templateProduct of templateSubcategory.templateProducts) {
      await createProductInstance(
        templateProduct,
        categoryId,
        subcategory.id,
        targetPlumbingConfig,
        mirrorImages
      );
    }
  }

  // Create direct product instances for category
  for (const templateProduct of template.templateProducts) {
    await createProductInstance(
      templateProduct,
      categoryId,
      null,
      targetPlumbingConfig,
      mirrorImages
    );
  }
}

/**
 * Helper function to create a product instance with variants
 * Handles image mirroring for different plumbing configurations
 */
async function createProductInstance(
  templateProduct: {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    thumbnailUrl: string | null;
    templateVariants: Array<{
      id: number;
      colorName: string;
      colorCode: string | null;
      imageUrl: string;
      publicId: string | null;
      plumbingConfig: PlumbingConfig;
    }>;
  },
  categoryId: number,
  subcategoryId: number | null,
  targetPlumbingConfig: PlumbingConfig,
  mirrorImages: boolean
) {
  const product = await prisma.product.create({
    data: {
      name: templateProduct.name,
      slug: templateProduct.slug,
      description: templateProduct.description,
      thumbnailUrl: templateProduct.thumbnailUrl,
      templateId: templateProduct.id,
      categoryId: categoryId,
      ...(subcategoryId && { subcategoryId }),
      plumbingConfig: targetPlumbingConfig,
      z_index: 50, // Default z_index
    },
  });

  // Create variant instances with smart image handling
  for (const templateVariant of templateProduct.templateVariants) {
    const variantPlumbingConfig =
      templateVariant.plumbingConfig || PlumbingConfig.LEFT;

    let finalImageUrl = templateVariant.imageUrl;

    // Apply mirroring if requested and needed
    if (mirrorImages) {
      finalImageUrl = getPlumbingAdjustedImage(
        templateVariant.imageUrl,
        variantPlumbingConfig,
        targetPlumbingConfig
      );
    }

    await prisma.productVariant.create({
      data: {
        colorName: templateVariant.colorName,
        colorCode: templateVariant.colorCode,
        imageUrl: finalImageUrl,
        publicId: templateVariant.publicId,
        plumbing_config: targetPlumbingConfig,
        templateVariantId: templateVariant.id,
        productId: product.id,
      },
    });
  }

  return product;
}
