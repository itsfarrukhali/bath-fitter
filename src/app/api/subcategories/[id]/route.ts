import { NextRequest } from "next/server";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/api-response";
import { handleApiError, NotFoundError, ConflictError } from "@/lib/error-handler";
import { subcategoryUpdateSchema } from "@/schemas/api-schemas";
import { validateData, validateIdParam } from "@/lib/validation";

type Params = Promise<{ id: string }>;

/**
 * GET /api/subcategories/[id]
 * Fetch a specific subcategory by ID
 */
export async function GET(
  _request: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const params = await segmentData.params;
    const id = validateIdParam(params.id);

    if (!id) {
      return createErrorResponse("Invalid subcategory ID", 400);
    }

    const subcategory = await prisma.subcategory.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            showerTypeId: true,
            showerType: {
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
            products: true,
          },
        },
      },
    });

    if (!subcategory) {
      throw new NotFoundError("Subcategory");
    }

    return createSuccessResponse(subcategory);
  } catch (error) {
    return handleApiError(error, "GET /api/subcategories/[id]");
  }
}

/**
 * PATCH /api/subcategories/[id]
 * Update a subcategory
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
      return createErrorResponse("Invalid subcategory ID", 400);
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = validateData(subcategoryUpdateSchema, body);

    if (!validation.success) {
      throw validation.errors;
    }

    const { name, slug, categoryId, templateId, z_index, plumbingConfig } =
      validation.data;

    // Check if subcategory exists
    const existingSubcategory = await prisma.subcategory.findUnique({
      where: { id },
    });

    if (!existingSubcategory) {
      throw new NotFoundError("Subcategory");
    }

    // Validate z_index range if provided
    if (z_index !== undefined && z_index !== null) {
      if (z_index < 0 || z_index > 100) {
        throw new Error("Z-Index must be between 0 and 100");
      }
    }

    // Validate category if being updated
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        throw new NotFoundError("Category");
      }
    }

    // Validate template if being updated
    if (templateId) {
      const template = await prisma.templateSubcategory.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        throw new NotFoundError("Template subcategory");
      }
    }

    // Check for duplicate slug if being changed
    if (slug && slug !== existingSubcategory.slug) {
      const targetCategoryId = categoryId || existingSubcategory.categoryId;
      const duplicate = await prisma.subcategory.findFirst({
        where: {
          slug,
          categoryId: targetCategoryId,
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new ConflictError(
          "Subcategory with this slug already exists in this category"
        );
      }
    }

    // Build update data
    const updateData: Prisma.SubcategoryUncheckedUpdateInput = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (templateId !== undefined) updateData.templateId = templateId;
    if (z_index !== undefined) updateData.z_index = z_index;
    if (plumbingConfig !== undefined && plumbingConfig !== null) updateData.plumbingConfig = plumbingConfig;

    const updatedSubcategory = await prisma.subcategory.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            showerType: {
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
        products: {
          include: {
            _count: {
              select: { variants: true },
            },
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    return createSuccessResponse(
      updatedSubcategory,
      "Subcategory updated successfully"
    );
  } catch (error) {
    return handleApiError(error, "PATCH /api/subcategories/[id]");
  }
}

/**
 * DELETE /api/subcategories/[id]
 * Delete a subcategory
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
      return createErrorResponse("Invalid subcategory ID", 400);
    }

    const existingSubcategory = await prisma.subcategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!existingSubcategory) {
      throw new NotFoundError("Subcategory");
    }

    // Prevent deletion if subcategory has products
    if (existingSubcategory._count.products > 0) {
      return createErrorResponse(
        "Cannot delete subcategory that has products. Please remove them first.",
        400
      );
    }

    await prisma.subcategory.delete({
      where: { id },
    });

    return createSuccessResponse(null, "Subcategory deleted successfully");
  } catch (error) {
    return handleApiError(error, "DELETE /api/subcategories/[id]");
  }
}
