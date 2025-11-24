import { NextRequest, NextResponse } from "next/server";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/api-response";
import { handleApiError, NotFoundError, ConflictError } from "@/lib/error-handler";
import { showerTypeUpdateSchema } from "@/schemas/api-schemas";
import { validateData, validateIdParam } from "@/lib/validation";

type Params = Promise<{ id: string }>;

/**
 * GET /api/shower-types/[id]
 * Fetch a specific shower type by ID
 */
export async function GET(
  _request: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const params = await segmentData.params;
    const id = validateIdParam(params.id);

    if (!id) {
      return createErrorResponse("Invalid shower type ID", 400);
    }

    const showerType = await prisma.showerType.findUnique({
      where: { id },
      include: {
        projectType: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        categories: {
          include: {
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
        },
        _count: {
          select: {
            categories: true,
            userDesigns: true,
          },
        },
      },
    });

    if (!showerType) {
      throw new NotFoundError("Shower type");
    }

    return createSuccessResponse(showerType);
  } catch (error) {
    return handleApiError(error, "GET /api/shower-types/[id]");
  }
}

/**
 * PATCH /api/shower-types/[id]
 * Update a shower type
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
      return createErrorResponse("Invalid shower type ID", 400);
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = validateData(showerTypeUpdateSchema, body);

    if (!validation.success) {
      throw validation.errors;
    }

    const { name, slug, projectTypeId, baseImage } = validation.data;

    // Check if shower type exists
    const existingShowerType = await prisma.showerType.findUnique({
      where: { id },
    });

    if (!existingShowerType) {
      throw new NotFoundError("Shower type");
    }

    // Validate project type if being updated
    if (projectTypeId) {
      const projectType = await prisma.projectType.findUnique({
        where: { id: projectTypeId },
      });

      if (!projectType) {
        throw new NotFoundError("Project type");
      }
    }

    // Check for duplicate slug if being changed
    if (slug && slug !== existingShowerType.slug) {
      const duplicate = await prisma.showerType.findFirst({
        where: {
          slug,
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new ConflictError("Shower type with this slug already exists");
      }
    }

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (projectTypeId !== undefined) updateData.projectTypeId = projectTypeId;
    if (baseImage !== undefined) updateData.baseImage = baseImage;

    const updatedShowerType = await prisma.showerType.update({
      where: { id },
      data: updateData,
      include: {
        projectType: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        categories: {
          include: {
            _count: {
              select: {
                subcategories: true,
                products: true,
              },
            },
          },
        },
        _count: {
          select: {
            categories: true,
            userDesigns: true,
          },
        },
      },
    });

    return createSuccessResponse(
      updatedShowerType,
      "Shower type updated successfully"
    );
  } catch (error) {
    return handleApiError(error, "PATCH /api/shower-types/[id]");
  }
}

/**
 * DELETE /api/shower-types/[id]
 * Delete a shower type
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
      return createErrorResponse("Invalid shower type ID", 400);
    }

    const existingShowerType = await prisma.showerType.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            categories: true,
            userDesigns: true,
          },
        },
      },
    });

    if (!existingShowerType) {
      throw new NotFoundError("Shower type");
    }

    // Prevent deletion if shower type has categories or user designs
    if (
      existingShowerType._count.categories > 0 ||
      existingShowerType._count.userDesigns > 0
    ) {
      return createErrorResponse(
        "Cannot delete shower type that has categories or user designs. Please remove them first.",
        400
      );
    }

    await prisma.showerType.delete({
      where: { id },
    });

    return createSuccessResponse(
      null,
      "Shower type deleted successfully"
    );
  } catch (error) {
    return handleApiError(error, "DELETE /api/shower-types/[id]");
  }
}
