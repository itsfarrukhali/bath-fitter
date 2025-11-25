import { NextRequest } from "next/server";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/api-response";
import { handleApiError, NotFoundError, ConflictError } from "@/lib/error-handler";
import { templateSubcategoryUpdateSchema } from "@/schemas/api-schemas";
import { validateData, validateIdParam } from "@/lib/validation";

type Params = Promise<{ id: string }>;

/**
 * GET /api/template-subcategories/[id]
 * Fetch a specific template subcategory by ID
 */
export async function GET(
  _request: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const params = await segmentData.params;
    const id = validateIdParam(params.id);

    if (!id) {
      return createErrorResponse("Invalid template subcategory ID", 400);
    }

    const templateSubcategory = await prisma.templateSubcategory.findUnique({
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
        templateProducts: {
          include: {
            _count: {
              select: { templateVariants: true },
            },
          },
          orderBy: { name: "asc" },
        },
        subcategories: {
          select: {
            id: true,
            name: true,
            slug: true,
            categoryId: true,
          },
        },
        _count: {
          select: {
            templateProducts: true,
            subcategories: true,
          },
        },
      },
    });

    if (!templateSubcategory) {
      throw new NotFoundError("Template subcategory");
    }

    return createSuccessResponse(templateSubcategory);
  } catch (error) {
    return handleApiError(error, "GET /api/template-subcategories/[id]");
  }
}

/**
 * PATCH /api/template-subcategories/[id]
 * Update a template subcategory
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
      return createErrorResponse("Invalid template subcategory ID", 400);
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = validateData(templateSubcategoryUpdateSchema, body);

    if (!validation.success) {
      throw validation.errors;
    }

    const { name, slug, description, templateCategoryId } = validation.data;

    // Check if template subcategory exists
    const existingTemplateSubcategory =
      await prisma.templateSubcategory.findUnique({
        where: { id },
      });

    if (!existingTemplateSubcategory) {
      throw new NotFoundError("Template subcategory");
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

    // Check for duplicate slug if being changed
    if (slug && slug !== existingTemplateSubcategory.slug) {
      const targetTemplateCategoryId =
        templateCategoryId || existingTemplateSubcategory.templateCategoryId;
      const duplicate = await prisma.templateSubcategory.findFirst({
        where: {
          slug,
          templateCategoryId: targetTemplateCategoryId,
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new ConflictError(
          "Template subcategory with this slug already exists in this template category"
        );
      }
    }

    // Build update data
    const updateData: Prisma.TemplateSubcategoryUncheckedUpdateInput = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (templateCategoryId !== undefined)
      updateData.templateCategoryId = templateCategoryId;

    const updatedTemplateSubcategory = await prisma.templateSubcategory.update({
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
        templateProducts: {
          include: {
            _count: {
              select: { templateVariants: true },
            },
          },
        },
        _count: {
          select: {
            templateProducts: true,
            subcategories: true,
          },
        },
      },
    });

    return createSuccessResponse(
      updatedTemplateSubcategory,
      "Template subcategory updated successfully"
    );
  } catch (error) {
    return handleApiError(error, "PATCH /api/template-subcategories/[id]");
  }
}

/**
 * DELETE /api/template-subcategories/[id]
 * Delete a template subcategory
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
      return createErrorResponse("Invalid template subcategory ID", 400);
    }

    const existingTemplateSubcategory =
      await prisma.templateSubcategory.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              templateProducts: true,
              subcategories: true,
            },
          },
        },
      });

    if (!existingTemplateSubcategory) {
      throw new NotFoundError("Template subcategory");
    }

    // Prevent deletion if template subcategory has products or is used by subcategories
    if (
      existingTemplateSubcategory._count.templateProducts > 0 ||
      existingTemplateSubcategory._count.subcategories > 0
    ) {
      return createErrorResponse(
        "Cannot delete template subcategory that has products or is being used by subcategories. Please remove them first.",
        400
      );
    }

    await prisma.templateSubcategory.delete({
      where: { id },
    });

    return createSuccessResponse(
      null,
      "Template subcategory deleted successfully"
    );
  } catch (error) {
    return handleApiError(error, "DELETE /api/template-subcategories/[id]");
  }
}
