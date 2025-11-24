import { NextRequest, NextResponse } from "next/server";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/api-response";
import { handleApiError, NotFoundError, ConflictError } from "@/lib/error-handler";
import { templateProductUpdateSchema } from "@/schemas/api-schemas";
import { validateData, validateIdParam } from "@/lib/validation";

type Params = Promise<{ id: string }>;

/**
 * GET /api/template-products/[id]
 * Fetch a specific template product by ID
 */
export async function GET(
  _request: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const params = await segmentData.params;
    const id = validateIdParam(params.id);

    if (!id) {
      return createErrorResponse("Invalid template product ID", 400);
    }

    const templateProduct = await prisma.templateProduct.findUnique({
      where: { id },
      include: {
        templateCategory: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
          },
        },
        templateSubcategory: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        templateVariants: {
          orderBy: { colorName: "asc" },
        },
        products: {
          select: {
            id: true,
            name: true,
            slug: true,
            categoryId: true,
          },
        },
        _count: {
          select: {
            templateVariants: true,
            products: true,
          },
        },
      },
    });

    if (!templateProduct) {
      throw new NotFoundError("Template product");
    }

    return createSuccessResponse(templateProduct);
  } catch (error) {
    return handleApiError(error, "GET /api/template-products/[id]");
  }
}

/**
 * PATCH /api/template-products/[id]
 * Update a template product
 * Protected endpoint - requires authentication
 */
export async function PATCH(
  request: NextRequest,
  segmentData: { params: Params }
) {
  try {
    // Authentication check
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createUnauthorizedResponse();
    }

    const params = await segmentData.params;
    const id = validateIdParam(params.id);

    if (!id) {
      return createErrorResponse("Invalid template product ID", 400);
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = validateData(templateProductUpdateSchema, body);

    if (!validation.success) {
      throw validation.errors;
    }

    const {
      name,
      slug,
      description,
      thumbnailUrl,
      templateCategoryId,
      templateSubcategoryId,
    } = validation.data;

    // Check if template product exists
    const existingTemplateProduct = await prisma.templateProduct.findUnique({
      where: { id },
    });

    if (!existingTemplateProduct) {
      throw new NotFoundError("Template product");
    }

    // Validate template category if being updated
    if (templateCategoryId) {
      const templateCategory = await prisma.templateCategory.findUnique({
        where: { id: templateCategoryId },
      });

      if (!templateCategory) {
        throw new NotFoundError("Template category");
      }
    }

    // Validate template subcategory if being updated
    if (templateSubcategoryId) {
      const targetTemplateCategoryId =
        templateCategoryId || existingTemplateProduct.templateCategoryId;
      const templateSubcategory = await prisma.templateSubcategory.findUnique({
        where: {
          id: templateSubcategoryId,
          templateCategoryId: targetTemplateCategoryId || undefined,
        },
      });

      if (!templateSubcategory) {
        throw new NotFoundError(
          "Template subcategory in this template category"
        );
      }
    }

    // Check for duplicate slug if being changed
    if (slug && slug !== existingTemplateProduct.slug) {
      const targetTemplateCategoryId =
        templateCategoryId || existingTemplateProduct.templateCategoryId;
      const targetTemplateSubcategoryId =
        templateSubcategoryId !== undefined
          ? templateSubcategoryId
          : existingTemplateProduct.templateSubcategoryId;

      const duplicate = await prisma.templateProduct.findFirst({
        where: {
          slug,
          OR: [
            { templateCategoryId: targetTemplateCategoryId, templateSubcategoryId: null },
            { templateSubcategoryId: targetTemplateSubcategoryId || undefined },
          ],
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new ConflictError("Template product with this slug already exists");
      }
    }

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;
    if (templateCategoryId !== undefined)
      updateData.templateCategoryId = templateCategoryId;
    if (templateSubcategoryId !== undefined)
      updateData.templateSubcategoryId = templateSubcategoryId;

    const updatedTemplateProduct = await prisma.templateProduct.update({
      where: { id },
      data: updateData,
      include: {
        templateCategory: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        templateSubcategory: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        templateVariants: true,
        _count: {
          select: {
            templateVariants: true,
            products: true,
          },
        },
      },
    });

    return createSuccessResponse(
      updatedTemplateProduct,
      "Template product updated successfully"
    );
  } catch (error) {
    return handleApiError(error, "PATCH /api/template-products/[id]");
  }
}

/**
 * DELETE /api/template-products/[id]
 * Delete a template product
 * Protected endpoint - requires authentication
 */
export async function DELETE(
  request: NextRequest,
  segmentData: { params: Params }
) {
  try {
    // Authentication check
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createUnauthorizedResponse();
    }

    const params = await segmentData.params;
    const id = validateIdParam(params.id);

    if (!id) {
      return createErrorResponse("Invalid template product ID", 400);
    }

    const existingTemplateProduct = await prisma.templateProduct.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            templateVariants: true,
            products: true,
          },
        },
      },
    });

    if (!existingTemplateProduct) {
      throw new NotFoundError("Template product");
    }

    // Prevent deletion if template product has variants or is used by products
    if (
      existingTemplateProduct._count.templateVariants > 0 ||
      existingTemplateProduct._count.products > 0
    ) {
      return createErrorResponse(
        "Cannot delete template product that has variants or is being used by products. Please remove them first.",
        400
      );
    }

    await prisma.templateProduct.delete({
      where: { id },
    });

    return createSuccessResponse(
      null,
      "Template product deleted successfully"
    );
  } catch (error) {
    return handleApiError(error, "DELETE /api/template-products/[id]");
  }
}
