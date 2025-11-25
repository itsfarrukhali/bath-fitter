import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";
import { createSuccessResponse } from "@/lib/api-response";
import { handleApiError, NotFoundError, ConflictError } from "@/lib/error-handler";
import { projectTypeUpdateSchema } from "@/schemas/api-schemas";
import { validateData, validateIdParam } from "@/lib/validation";

type Params = Promise<{ id: string }>;

/**
 * GET /api/project-types/[id]
 * Fetch a single project type by ID
 */
export async function GET(
  request: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const params = await segmentData.params;
    const id = validateIdParam(params.id);
    if (!id) {
      throw new Error("Invalid ID format");
    }

    const projectType = await prisma.projectType.findUnique({
      where: { id },
      include: {
        showerTypes: {
          include: {
            _count: {
              select: {
                categories: true,
                userDesigns: true,
              },
            },
          },
          orderBy: { name: "asc" },
        },
        _count: {
          select: {
            showerTypes: true,
          },
        },
      },
    });

    if (!projectType) {
      throw new NotFoundError("Project type");
    }

    return createSuccessResponse(projectType);
  } catch (error) {
    return handleApiError(error, `GET /api/project-types/[id]`);
  }
}

/**
 * PATCH /api/project-types/[id]
 * Update a project type
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
      throw new Error("Invalid ID format");
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = validateData(projectTypeUpdateSchema, body);

    if (!validation.success) {
      throw validation.errors;
    }

    const { name, slug, imageUrl } = validation.data;

    // Check if project type exists
    const existingProjectType = await prisma.projectType.findUnique({
      where: { id },
    });

    if (!existingProjectType) {
      throw new NotFoundError("Project type");
    }

    // Check for slug conflict if slug is being updated
    if (slug && slug !== existingProjectType.slug) {
      const conflictingProjectType = await prisma.projectType.findUnique({
        where: { slug },
      });

      if (conflictingProjectType) {
        throw new ConflictError("Project type with this slug already exists");
      }
    }

    // Update project type
    const projectType = await prisma.projectType.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(imageUrl !== undefined && { imageUrl }),
      },
      include: {
        _count: {
          select: {
            showerTypes: true,
          },
        },
      },
    });

    return createSuccessResponse(
      projectType,
      "Project type updated successfully"
    );
  } catch (error) {
    return handleApiError(error, `PATCH /api/project-types/[id]`);
  }
}

/**
 * DELETE /api/project-types/[id]
 * Delete a project type
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
      throw new Error("Invalid ID format");
    }

    // Check if project type exists
    const projectType = await prisma.projectType.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            showerTypes: true,
          },
        },
      },
    });

    if (!projectType) {
      throw new NotFoundError("Project type");
    }

    // Check if project type has associated shower types
    if (projectType._count.showerTypes > 0) {
      throw new Error(
        `Cannot delete project type with ${projectType._count.showerTypes} associated shower type(s)`
      );
    }

    // Delete project type
    await prisma.projectType.delete({
      where: { id },
    });

    return createSuccessResponse(
      { id },
      "Project type deleted successfully"
    );
  } catch (error) {
    return handleApiError(error, `DELETE /api/project-types/[id]`);
  }
}
