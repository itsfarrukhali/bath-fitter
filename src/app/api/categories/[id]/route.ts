import { NextRequest, NextResponse } from "next/server";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/api-response";
import { handleApiError, NotFoundError, ConflictError } from "@/lib/error-handler";
import { categoryUpdateSchema } from "@/schemas/api-schemas";
import { validateData, validateIdParam } from "@/lib/validation";

type Params = Promise<{ id: string }>;

/**
 * GET /api/categories/[id]
 * Fetch a specific category by ID
 */
export async function GET(
  _request: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const params = await segmentData.params;
    const id = validateIdParam(params.id);

    if (!id) {
      return createErrorResponse("Invalid category ID", 400);
    }

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        showerType: {
          select: {
            id: true,
            name: true,
            slug: true,
            projectType: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        subcategories: {
          include: {
            _count: {
              select: { products: true },
            },
          },
          orderBy: [{ z_index: "asc" }, { name: "asc" }],
        },
        products: {
          include: {
            _count: {
              select: { variants: true },
            },
          },
          orderBy: [{ z_index: "asc" }, { name: "asc" }],
        },
        _count: {
          select: {
            subcategories: true,
            products: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundError("Category");
    }

    return createSuccessResponse(category);
  } catch (error) {
    return handleApiError(error, "GET /api/categories/[id]");
  }
}

/**
 * PATCH /api/categories/[id]
 * Update a category
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
      return createErrorResponse("Invalid category ID", 400);
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = validateData(categoryUpdateSchema, body);

    if (!validation.success) {
      throw validation.errors;
    }

    const {
      name,
      slug,
      hasSubcategories,
      showerTypeId,
      templateId,
      z_index,
      plumbingConfig,
    } = validation.data;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new NotFoundError("Category");
    }

    // Validate z_index range if provided
    if (z_index !== undefined && z_index !== null) {
      if (z_index < 0 || z_index > 100) {
        throw new Error("Z-Index must be between 0 and 100");
      }
    }

    // Validate shower type if being updated
    if (showerTypeId) {
      const showerType = await prisma.showerType.findUnique({
        where: { id: showerTypeId },
      });

      if (!showerType) {
        throw new NotFoundError("Shower type");
      }
    }

    // Validate template if being updated
    if (templateId) {
      const template = await prisma.templateCategory.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        throw new NotFoundError("Template category");
      }
    }

    // Check for duplicate slug if being changed
    if (slug && slug !== existingCategory.slug) {
      const targetShowerTypeId = showerTypeId || existingCategory.showerTypeId;
      const duplicate = await prisma.category.findFirst({
        where: {
          slug,
          showerTypeId: targetShowerTypeId,
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new ConflictError(
          "Category with this slug already exists in this shower type"
        );
      }
    }

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (hasSubcategories !== undefined)
      updateData.hasSubcategories = hasSubcategories;
    if (showerTypeId !== undefined) updateData.showerTypeId = showerTypeId;
    if (templateId !== undefined) updateData.templateId = templateId;
    if (z_index !== undefined) updateData.z_index = z_index;
    if (plumbingConfig !== undefined) updateData.plumbingConfig = plumbingConfig;

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: updateData,
      include: {
        showerType: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        subcategories: {
          include: {
            _count: {
              select: { products: true },
            },
          },
        },
        products: {
          include: {
            _count: {
              select: { variants: true },
            },
          },
        },
        _count: {
          select: {
            subcategories: true,
            products: true,
          },
        },
      },
    });

    return createSuccessResponse(
      updatedCategory,
      "Category updated successfully"
    );
  } catch (error) {
    return handleApiError(error, "PATCH /api/categories/[id]");
  }
}

/**
 * DELETE /api/categories/[id]
 * Delete a category
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
      return createErrorResponse("Invalid category ID", 400);
    }

    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subcategories: true,
            products: true,
          },
        },
      },
    });

    if (!existingCategory) {
      throw new NotFoundError("Category");
    }

    // Prevent deletion if category has subcategories or products
    if (
      existingCategory._count.subcategories > 0 ||
      existingCategory._count.products > 0
    ) {
      return createErrorResponse(
        "Cannot delete category that has subcategories or products. Please remove them first.",
        400
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return createSuccessResponse(null, "Category deleted successfully");
  } catch (error) {
    return handleApiError(error, "DELETE /api/categories/[id]");
  }
}
