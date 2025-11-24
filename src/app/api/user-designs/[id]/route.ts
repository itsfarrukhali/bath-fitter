import { NextRequest, NextResponse } from "next/server";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/api-response";
import { handleApiError, NotFoundError } from "@/lib/error-handler";
import { validateIdParam } from "@/lib/validation";
import { Prisma } from "@prisma/client";

type Params = Promise<{ id: string }>;

/**
 * GET /api/user-designs/[id]
 * Fetch a specific user design by ID
 * Public endpoint - anyone can view a design if they have the ID
 */
export async function GET(
  _request: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const params = await segmentData.params;
    const id = validateIdParam(params.id);

    if (!id) {
      return createErrorResponse("Invalid user design ID", 400);
    }

    const userDesign = await prisma.userDesign.findUnique({
      where: { id },
      include: {
        showerType: {
          select: {
            id: true,
            name: true,
            slug: true,
            baseImage: true,
            projectType: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!userDesign) {
      throw new NotFoundError("User design");
    }

    return createSuccessResponse(userDesign);
  } catch (error) {
    return handleApiError(error, "GET /api/user-designs/[id]");
  }
}

/**
 * PATCH /api/user-designs/[id]
 * Update an existing user design
 * Public endpoint - allows users to edit and re-save their designs
 * 
 * Flow:
 * 1. User loads existing design by email
 * 2. User selects a design to edit
 * 3. User makes changes
 * 4. User saves again (updates the existing design)
 */
export async function PATCH(
  request: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const params = await segmentData.params;
    const id = validateIdParam(params.id);

    if (!id) {
      return createErrorResponse("Invalid user design ID", 400);
    }

    // Parse request body
    const body = await request.json();
    const { designData, userFullName, userPhone, userPostalCode } = body;

    // Check if design exists
    const existingDesign = await prisma.userDesign.findUnique({
      where: { id },
    });

    if (!existingDesign) {
      throw new NotFoundError("User design");
    }

    // Build update data
    const updateData: any = {};
    if (designData !== undefined)
      updateData.designData = designData as Prisma.InputJsonValue;
    if (userFullName !== undefined) updateData.userFullName = userFullName;
    if (userPhone !== undefined) updateData.userPhone = userPhone;
    if (userPostalCode !== undefined) updateData.userPostalCode = userPostalCode;

    // Update the design
    const updatedDesign = await prisma.userDesign.update({
      where: { id },
      data: updateData,
      include: {
        showerType: {
          select: {
            id: true,
            name: true,
            slug: true,
            baseImage: true,
            projectType: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    return createSuccessResponse(
      updatedDesign,
      "Design updated successfully!"
    );
  } catch (error) {
    return handleApiError(error, "PATCH /api/user-designs/[id]");
  }
}

/**
 * DELETE /api/user-designs/[id]
 * Delete a user design
 * Protected endpoint - requires authentication (admin only)
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
      return createErrorResponse("Invalid user design ID", 400);
    }

    const existingUserDesign = await prisma.userDesign.findUnique({
      where: { id },
    });

    if (!existingUserDesign) {
      throw new NotFoundError("User design");
    }

    await prisma.userDesign.delete({
      where: { id },
    });

    return createSuccessResponse(null, "User design deleted successfully");
  } catch (error) {
    return handleApiError(error, "DELETE /api/user-designs/[id]");
  }
}
