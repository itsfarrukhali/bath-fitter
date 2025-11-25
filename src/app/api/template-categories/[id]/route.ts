import { NextRequest } from "next/server";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/api-response";
import { handleApiError, NotFoundError, ConflictError } from "@/lib/error-handler";
import { templateCategoryUpdateSchema } from "@/schemas/api-schemas";
import { validateData, validateIdParam } from "@/lib/validation";

type Params = Promise<{ id: string }>;

/**
 * GET /api/template-categories/[id]
 * Fetch a specific template category by ID
 */
export async function GET(
  _request: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const params = await segmentData.params;
    const id = validateIdParam(params.id);

    if (!id) {
      return createErrorResponse("Invalid template category ID", 400);
    }

    const templateCategory = await prisma.templateCategory.findUnique({
      where: { id },
      include: {
        templateSubcategories: {
          include: {
            _count: {
              select: { templateProducts: true },
            },
          },
          orderBy: { name: "asc" },
        },
        templateProducts: {
          include: {
            _count: {
              select: { templateVariants: true },
            },
          },
          orderBy: { name: "asc" },
        },
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
            showerTypeId: true,
          },
        },
        _count: {
          select: {
            templateSubcategories: true,
            templateProducts: true,
            categories: true,
          },
        },
      },
    });

    if (!templateCategory) {
      throw new NotFoundError("Template category");
    }

    return createSuccessResponse(templateCategory);
  } catch (error) {
    return handleApiError(error, "GET /api/template-categories/[id]");
  }
}

/**
 * PATCH /api/template-categories/[id]
 * Update a template category
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
      return createErrorResponse("Invalid template category ID", 400);
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = validateData(templateCategoryUpdateSchema, body);

    if (!validation.success) {
      throw validation.errors;
    }

    const { name, slug, description, isActive } = validation.data;

    // Check if template category exists
    const existingTemplateCategory = await prisma.templateCategory.findUnique({
      where: { id },
    });

    if (!existingTemplateCategory) {
      throw new NotFoundError("Template category");
    }

    // Check for duplicate slug if being changed
    if (slug && slug !== existingTemplateCategory.slug) {
      const duplicate = await prisma.templateCategory.findFirst({
        where: {
          slug,
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new ConflictError(
          "Template category with this slug already exists"
        );
      }
    }

    // Build update data
    const updateData: Prisma.TemplateCategoryUncheckedUpdateInput = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedTemplateCategory = await prisma.templateCategory.update({
      where: { id },
      data: updateData,
      include: {
        templateSubcategories: {
          include: {
            _count: {
              select: { templateProducts: true },
            },
          },
        },
        templateProducts: {
          include: {
            _count: {
              select: { templateVariants: true },
            },
          },
        },
        _count: {
          select: {
            templateSubcategories: true,
            templateProducts: true,
            categories: true,
          },
        },
      },
    });

    return createSuccessResponse(
      updatedTemplateCategory,
      "Template category updated successfully"
    );
  } catch (error) {
    return handleApiError(error, "PATCH /api/template-categories/[id]");
  }
}

/**
 * DELETE /api/template-categories/[id]
 * Delete a template category
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
      return createErrorResponse("Invalid template category ID", 400);
    }

    const existingTemplateCategory = await prisma.templateCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            templateSubcategories: true,
            templateProducts: true,
            categories: true,
          },
        },
      },
    });

    if (!existingTemplateCategory) {
      throw new NotFoundError("Template category");
    }

    // Prevent deletion if template category has subcategories, products, or is used by categories
    if (
      existingTemplateCategory._count.templateSubcategories > 0 ||
      existingTemplateCategory._count.templateProducts > 0 ||
      existingTemplateCategory._count.categories > 0
    ) {
      return createErrorResponse(
        "Cannot delete template category that has subcategories, products, or is being used by categories. Please remove them first.",
        400
      );
    }

    await prisma.templateCategory.delete({
      where: { id },
    });

    return createSuccessResponse(
      null,
      "Template category deleted successfully"
    );
  } catch (error) {
    return handleApiError(error, "DELETE /api/template-categories/[id]");
  }
}
