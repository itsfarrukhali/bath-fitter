import { NextRequest } from "next/server";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PlumbingConfig, Prisma } from "@prisma/client";
import {
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/api-response";
import { handleApiError, NotFoundError, ConflictError } from "@/lib/error-handler";
import { productVariantUpdateSchema } from "@/schemas/api-schemas";
import { validateData, validateIdParam } from "@/lib/validation";

type Params = Promise<{ id: string }>;

/**
 * GET /api/variants/[id]
 * Fetch a specific variant by ID
 */
export async function GET(
  _request: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const params = await segmentData.params;
    const id = validateIdParam(params.id);

    if (!id) {
      return createErrorResponse("Invalid variant ID", 400);
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: {
              select: {
                id: true,
                name: true,
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
          },
        },
        templateVariant: {
          select: {
            id: true,
            colorName: true,
            colorCode: true,
          },
        },
      },
    });

    if (!variant) {
      throw new NotFoundError("Product variant");
    }

    return createSuccessResponse(variant);
  } catch (error) {
    return handleApiError(error, "GET /api/variants/[id]");
  }
}

/**
 * PATCH /api/variants/[id]
 * Update a product variant
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
      return createErrorResponse("Invalid variant ID", 400);
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = validateData(productVariantUpdateSchema, body);

    if (!validation.success) {
      throw validation.errors;
    }

    const {
      colorName,
      colorCode,
      imageUrl,
      publicId,
      productId,
      plumbing_config,
      templateVariantId,
    } = validation.data;

    // Check if variant exists
    const existingVariant = await prisma.productVariant.findUnique({
      where: { id },
    });

    if (!existingVariant) {
      throw new NotFoundError("Product variant");
    }

    // Validate plumbing_config if provided
    if (
      plumbing_config &&
      !Object.values(PlumbingConfig).includes(plumbing_config)
    ) {
      throw new Error("Invalid plumbing configuration");
    }

    // Validate product if being updated
    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new NotFoundError("Product");
      }
    }

    // Validate template variant if being updated
    if (templateVariantId) {
      const templateVariant = await prisma.templateVariant.findUnique({
        where: { id: templateVariantId },
      });

      if (!templateVariant) {
        throw new NotFoundError("Template variant");
      }
    }

    // Check for duplicate color name if being changed
    if (colorName && colorName !== existingVariant.colorName) {
      const targetProductId = productId || existingVariant.productId;
      const duplicate = await prisma.productVariant.findFirst({
        where: {
          colorName,
          productId: targetProductId,
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new ConflictError(
          "Variant with this color name already exists in this product"
        );
      }
    }

    // Build update data
    const updateData: Prisma.ProductVariantUncheckedUpdateInput = {};
    if (colorName !== undefined) updateData.colorName = colorName;
    if (colorCode !== undefined) updateData.colorCode = colorCode;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (publicId !== undefined) updateData.publicId = publicId;
    if (productId !== undefined) updateData.productId = productId;
    if (plumbing_config !== undefined && plumbing_config !== null)
      updateData.plumbing_config = plumbing_config;
    if (templateVariantId !== undefined)
      updateData.templateVariantId = templateVariantId;

    const updatedVariant = await prisma.productVariant.update({
      where: { id },
      data: updateData,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: {
              select: {
                id: true,
                name: true,
                showerType: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
        templateVariant: {
          select: {
            id: true,
            colorName: true,
            colorCode: true,
          },
        },
      },
    });

    return createSuccessResponse(
      updatedVariant,
      "Product variant updated successfully"
    );
  } catch (error) {
    return handleApiError(error, "PATCH /api/variants/[id]");
  }
}

/**
 * DELETE /api/variants/[id]
 * Delete a product variant
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
      return createErrorResponse("Invalid variant ID", 400);
    }

    const existingVariant = await prisma.productVariant.findUnique({
      where: { id },
    });

    if (!existingVariant) {
      throw new NotFoundError("Product variant");
    }

    await prisma.productVariant.delete({
      where: { id },
    });

    return createSuccessResponse(null, "Product variant deleted successfully");
  } catch (error) {
    return handleApiError(error, "DELETE /api/variants/[id]");
  }
}
