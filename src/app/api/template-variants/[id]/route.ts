import { NextRequest } from "next/server";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { PlumbingConfig } from "@prisma/client";
import {
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/api-response";
import { handleApiError, NotFoundError, ConflictError } from "@/lib/error-handler";
import { templateVariantUpdateSchema } from "@/schemas/api-schemas";
import { validateData, validateIdParam } from "@/lib/validation";

type Params = Promise<{ id: string }>;

/**
 * GET /api/template-variants/[id]
 * Fetch a specific template variant by ID
 */
export async function GET(
  _request: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const params = await segmentData.params;
    const id = validateIdParam(params.id);

    if (!id) {
      return createErrorResponse("Invalid template variant ID", 400);
    }

    const templateVariant = await prisma.templateVariant.findUnique({
      where: { id },
      include: {
        templateProduct: {
          select: {
            id: true,
            name: true,
            slug: true,
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
          },
        },
        ProductVariant: {
          select: {
            id: true,
            colorName: true,
            productId: true,
          },
        },
        _count: {
          select: {
            ProductVariant: true,
          },
        },
      },
    });

    if (!templateVariant) {
      throw new NotFoundError("Template variant");
    }

    return createSuccessResponse(templateVariant);
  } catch (error) {
    return handleApiError(error, "GET /api/template-variants/[id]");
  }
}

/**
 * PATCH /api/template-variants/[id]
 * Update a template variant
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
      return createErrorResponse("Invalid template variant ID", 400);
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = validateData(templateVariantUpdateSchema, body);

    if (!validation.success) {
      throw validation.errors;
    }

    const {
      colorName,
      colorCode,
      imageUrl,
      publicId,
      templateProductId,
      plumbingConfig,
    } = validation.data;

    // Check if template variant exists
    const existingTemplateVariant = await prisma.templateVariant.findUnique({
      where: { id },
    });

    if (!existingTemplateVariant) {
      throw new NotFoundError("Template variant");
    }

    // Validate plumbing config if provided
    if (
      plumbingConfig &&
      !Object.values(PlumbingConfig).includes(plumbingConfig)
    ) {
      throw new Error("Invalid plumbing configuration");
    }

    // Validate template product if being updated
    if (templateProductId) {
      const templateProduct = await prisma.templateProduct.findUnique({
        where: { id: templateProductId },
      });

      if (!templateProduct) {
        throw new NotFoundError("Template product");
      }
    }

    // Check for duplicate color name if being changed
    if (colorName && colorName !== existingTemplateVariant.colorName) {
      const targetTemplateProductId =
        templateProductId || existingTemplateVariant.templateProductId;
      const duplicate = await prisma.templateVariant.findFirst({
        where: {
          colorName,
          templateProductId: targetTemplateProductId,
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new ConflictError(
          "Template variant with this color name already exists in this template product"
        );
      }
    }

    // Build update data
    const updateData: Prisma.TemplateVariantUncheckedUpdateInput = {};
    if (colorName !== undefined) updateData.colorName = colorName;
    if (colorCode !== undefined) updateData.colorCode = colorCode;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (publicId !== undefined) updateData.publicId = publicId;
    if (templateProductId !== undefined)
      updateData.templateProductId = templateProductId;
    if (plumbingConfig !== undefined && plumbingConfig !== null)
      updateData.plumbingConfig = plumbingConfig;

    const updatedTemplateVariant = await prisma.templateVariant.update({
      where: { id },
      data: updateData,
      include: {
        templateProduct: {
          select: {
            id: true,
            name: true,
            slug: true,
            templateCategory: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            ProductVariant: true,
          },
        },
      },
    });

    return createSuccessResponse(
      updatedTemplateVariant,
      "Template variant updated successfully"
    );
  } catch (error) {
    return handleApiError(error, "PATCH /api/template-variants/[id]");
  }
}

/**
 * DELETE /api/template-variants/[id]
 * Delete a template variant
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
      return createErrorResponse("Invalid template variant ID", 400);
    }

    const existingTemplateVariant = await prisma.templateVariant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            ProductVariant: true,
          },
        },
      },
    });

    if (!existingTemplateVariant) {
      throw new NotFoundError("Template variant");
    }

    // Prevent deletion if template variant is used by product variants
    if (existingTemplateVariant._count.ProductVariant > 0) {
      return createErrorResponse(
        "Cannot delete template variant that is being used by product variants. Please remove them first.",
        400
      );
    }

    await prisma.templateVariant.delete({
      where: { id },
    });

    return createSuccessResponse(
      null,
      "Template variant deleted successfully"
    );
  } catch (error) {
    return handleApiError(error, "DELETE /api/template-variants/[id]");
  }
}
