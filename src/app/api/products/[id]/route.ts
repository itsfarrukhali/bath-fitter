import { NextRequest } from "next/server";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/api-response";
import { handleApiError, NotFoundError, ConflictError } from "@/lib/error-handler";
import { productUpdateSchema } from "@/schemas/api-schemas";
import { validateData, validateIdParam } from "@/lib/validation";

type Params = Promise<{ id: string }>;

/**
 * GET /api/products/[id]
 * Fetch a specific product by ID
 */
export async function GET(
  _request: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const params = await segmentData.params;
    const id = validateIdParam(params.id);

    if (!id) {
      return createErrorResponse("Invalid product ID", 400);
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            showerTypeId: true,
            z_index: true,
            showerType: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        subcategory: {
          select: {
            id: true,
            name: true,
            slug: true,
            z_index: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        variants: {
          orderBy: { colorName: "asc" },
        },
        _count: {
          select: { variants: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundError("Product");
    }

    return createSuccessResponse(product);
  } catch (error) {
    return handleApiError(error, "GET /api/products/[id]");
  }
}

/**
 * PATCH /api/products/[id]
 * Update a product
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
      return createErrorResponse("Invalid product ID", 400);
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = validateData(productUpdateSchema, body);

    if (!validation.success) {
      throw validation.errors;
    }

    const {
      name,
      slug,
      description,
      thumbnailUrl,
      categoryId,
      subcategoryId,
      templateId,
      z_index,
      plumbingConfig,
    } = validation.data;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new NotFoundError("Product");
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

    // Validate subcategory if being updated
    if (subcategoryId) {
      const targetCategoryId = categoryId || existingProduct.categoryId;
      const subcategory = await prisma.subcategory.findUnique({
        where: { id: subcategoryId, categoryId: targetCategoryId },
      });

      if (!subcategory) {
        throw new NotFoundError("Subcategory in this category");
      }
    }

    // Validate template if being updated
    if (templateId) {
      const template = await prisma.templateProduct.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        throw new NotFoundError("Template product");
      }
    }

    // Check for duplicate slug if being changed
    if (slug && slug !== existingProduct.slug) {
      const targetCategoryId = categoryId || existingProduct.categoryId;
      const targetSubcategoryId =
        subcategoryId !== undefined
          ? subcategoryId
          : existingProduct.subcategoryId;

      const duplicate = await prisma.product.findFirst({
        where: {
          slug,
          OR: [
            { categoryId: targetCategoryId, subcategoryId: null },
            { subcategoryId: targetSubcategoryId || undefined },
          ],
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new ConflictError("Product with this slug already exists");
      }
    }

    // Build update data
    const updateData: Prisma.ProductUncheckedUpdateInput = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (subcategoryId !== undefined) updateData.subcategoryId = subcategoryId;
    if (templateId !== undefined) updateData.templateId = templateId;
    if (z_index !== undefined) updateData.z_index = z_index;
    if (plumbingConfig !== undefined && plumbingConfig !== null) updateData.plumbingConfig = plumbingConfig;

    const updatedProduct = await prisma.product.update({
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
            z_index: true,
          },
        },
        subcategory: {
          select: {
            id: true,
            name: true,
            slug: true,
            z_index: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        variants: true,
        _count: { select: { variants: true } },
      },
    });

    return createSuccessResponse(updatedProduct, "Product updated successfully");
  } catch (error) {
    return handleApiError(error, "PATCH /api/products/[id]");
  }
}

/**
 * DELETE /api/products/[id]
 * Delete a product
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
      return createErrorResponse("Invalid product ID", 400);
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            variants: true,
          },
        },
      },
    });

    if (!existingProduct) {
      throw new NotFoundError("Product");
    }

    // Prevent deletion if product has variants
    if (existingProduct._count.variants > 0) {
      return createErrorResponse(
        "Cannot delete product that has variants. Please remove them first.",
        400
      );
    }

    await prisma.product.delete({
      where: { id },
    });

    return createSuccessResponse(null, "Product deleted successfully");
  } catch (error) {
    return handleApiError(error, "DELETE /api/products/[id]");
  }
}
