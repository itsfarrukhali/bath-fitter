// app/api/templates/instantiate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface InstantiateRequest {
  templateCategoryId: number;
  showerTypeIds: number[];
  customName?: string;
}

// Define proper interfaces for the template data
interface TemplateVariantData {
  id: number;
  colorName: string;
  colorCode?: string;
  imageUrl: string;
  publicId?: string;
  templateProductId: number;
  createdAt: Date;
  updatedAt: Date;
}

interface TemplateProductData {
  id: number;
  name: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
  templateCategoryId?: number;
  templateSubcategoryId?: number;
  templateVariants: TemplateVariantData[];
}

interface TemplateSubcategoryData {
  id: number;
  name: string;
  slug: string;
  description?: string;
  templateCategoryId: number;
  templateProducts: TemplateProductData[];
}

interface TemplateCategoryData {
  id: number;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  templateSubcategories: TemplateSubcategoryData[];
  templateProducts: TemplateProductData[];
}

interface ProductCreateData {
  name: string;
  slug: string;
  templateId: number;
  categoryId: number;
  subcategoryId?: number;
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createUnauthorizedResponse();
    }

    const body: InstantiateRequest = await request.json();
    const { templateCategoryId, showerTypeIds, customName } = body;

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
      success: boolean;
      message?: string;
      categoryId?: number;
    }> = [];

    for (const showerTypeId of showerTypeIds) {
      // Check if shower type exists
      const showerType = await prisma.showerType.findUnique({
        where: { id: showerTypeId },
      });

      if (!showerType) {
        results.push({
          showerTypeId,
          success: false,
          message: "Shower type not found",
        });
        continue;
      }

      // Create category instance
      const category = await prisma.category.create({
        data: {
          name: customName || template.name,
          slug: template.slug,
          templateId: template.id,
          showerTypeId: showerTypeId,
          hasSubcategories: template.templateSubcategories.length > 0,
        },
      });

      // Create subcategory instances
      for (const templateSubcategory of template.templateSubcategories) {
        const subcategory = await prisma.subcategory.create({
          data: {
            name: templateSubcategory.name,
            slug: templateSubcategory.slug,
            templateId: templateSubcategory.id,
            categoryId: category.id,
          },
        });

        // Create product instances for subcategory
        for (const templateProduct of templateSubcategory.templateProducts) {
          await createProductInstance(
            templateProduct as TemplateProductData,
            category.id,
            subcategory.id
          );
        }
      }

      // Create direct product instances for category
      for (const templateProduct of template.templateProducts) {
        await createProductInstance(
          templateProduct as TemplateProductData,
          category.id,
          null
        );
      }

      results.push({ showerTypeId, success: true, categoryId: category.id });
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: "Template instantiated successfully",
    });
  } catch (error) {
    console.error("Error instantiating template:", error);
    return NextResponse.json(
      { success: false, message: "Failed to instantiate template" },
      { status: 500 }
    );
  }
}

async function createProductInstance(
  templateProduct: TemplateProductData,
  categoryId: number,
  subcategoryId: number | null
) {
  // Use Prisma's proper type instead of 'any'
  const productData: Prisma.ProductCreateInput = {
    name: templateProduct.name,
    slug: templateProduct.slug,
    template: templateProduct.id
      ? { connect: { id: templateProduct.id } }
      : undefined,
    category: { connect: { id: categoryId } },
    ...(subcategoryId && { subcategory: { connect: { id: subcategoryId } } }),
  };

  const product = await prisma.product.create({
    data: productData,
  });

  // Create variant instances
  for (const templateVariant of templateProduct.templateVariants) {
    await prisma.productVariant.create({
      data: {
        colorName: templateVariant.colorName,
        colorCode: templateVariant.colorCode,
        imageUrl: templateVariant.imageUrl,
        templateVariant: templateVariant.id
          ? { connect: { id: templateVariant.id } }
          : undefined,
        product: { connect: { id: product.id } },
      },
    });
  }

  return product;
}
