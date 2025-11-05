// app/api/templates/instantiate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PlumbingConfig, PlumbingOptions } from "@/types/template";
import { getPlumbingAdjustedImage } from "@/lib/cloudinary";

interface InstantiateRequest {
  templateCategoryId: number;
  showerTypeIds: number[];
  customName?: string;
  plumbingOptions: PlumbingOptions;
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createUnauthorizedResponse();
    }

    const body: InstantiateRequest = await request.json();
    const { templateCategoryId, showerTypeIds, customName, plumbingOptions } =
      body;

    // Validate plumbing options
    if (!plumbingOptions.createForLeft && !plumbingOptions.createForRight) {
      return NextResponse.json(
        {
          success: false,
          message: "At least one plumbing option must be selected",
        },
        { status: 400 }
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
      return NextResponse.json(
        { success: false, message: "Template not found" },
        { status: 404 }
      );
    }

    const results: Array<{
      showerTypeId: number;
      plumbingConfig: PlumbingConfig;
      success: boolean;
      message?: string;
      categoryId?: number;
    }> = [];

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
              } with ${plumbingConfig.toLowerCase()} plumbing.`,
            });
            continue;
          }

          // Create category instance
          const category = await prisma.category.create({
            data: {
              name: `${
                customName || template.name
              } - ${plumbingConfig.toLowerCase()}`,
              slug: `${template.slug}-${plumbingConfig.toLowerCase()}`,
              templateId: template.id,
              showerTypeId: showerTypeId,
              plumbingConfig: plumbingConfig,
              hasSubcategories: template.templateSubcategories.length > 0,
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

    return NextResponse.json({
      success: true,
      data: results,
      message: "Template instantiation completed",
    });
  } catch (error) {
    console.error("Error instantiating template:", error);
    return NextResponse.json(
      { success: false, message: "Failed to instantiate template" },
      { status: 500 }
    );
  }
}

async function createTemplateInstances(
  template: any,
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

async function createProductInstance(
  templateProduct: any,
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
      template: templateProduct.id
        ? { connect: { id: templateProduct.id } }
        : undefined,
      category: { connect: { id: categoryId } },
      ...(subcategoryId && { subcategory: { connect: { id: subcategoryId } } }),
      plumbingConfig: targetPlumbingConfig,
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
        templateVariant: templateVariant.id
          ? { connect: { id: templateVariant.id } }
          : undefined,
        product: { connect: { id: product.id } },
      },
    });
  }

  return product;
}
