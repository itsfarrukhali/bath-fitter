// app/api/shower-types/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ShowerTypeUpdateData } from "@/types/shower-types";
import { getAuthenticatedUser, createUnauthorizedResponse } from "@/lib/auth";

type Params = Promise<{ id: string }>;

// GET - Fetch a specific shower type by ID
export async function GET(
  _request: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const params = await segmentData.params;
    const { id } = params;

    const showerType = await prisma.showerType.findUnique({
      where: { id: parseInt(id) },
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
            UserDesign: true,
          },
        },
      },
    });

    if (!showerType) {
      return NextResponse.json(
        { success: false, message: "Shower type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: showerType,
    });
  } catch (error) {
    console.error("Error fetching shower type:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch shower type" },
      { status: 500 }
    );
  }
}

// PUT - Update a shower type
export async function PUT(
  request: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createUnauthorizedResponse();
    }

    const params = await segmentData.params;
    const { id } = params;
    const body: ShowerTypeUpdateData = await request.json();
    const { name, slug, projectTypeId, baseImage } = body;

    // Check if shower type exists
    const existingShowerType = await prisma.showerType.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingShowerType) {
      return NextResponse.json(
        { success: false, message: "Shower type not found" },
        { status: 404 }
      );
    }

    // Check if project type exists if being updated
    if (projectTypeId) {
      const projectType = await prisma.projectType.findUnique({
        where: { id: projectTypeId },
      });

      if (!projectType) {
        return NextResponse.json(
          { success: false, message: "Project type not found" },
          { status: 404 }
        );
      }
    }

    // Check if slug is being changed and if it's already taken
    if (slug && slug !== existingShowerType.slug) {
      const duplicate = await prisma.showerType.findFirst({
        where: {
          slug,
          id: { not: parseInt(id) }, // exclude current shower type
        },
      });

      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            message: "Shower type with this slug already exists",
          },
          { status: 409 }
        );
      }
    }

    const updatedShowerType = await prisma.showerType.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(projectTypeId && { projectTypeId }),
        ...(baseImage !== undefined && { baseImage }),
      },
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
            UserDesign: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedShowerType,
      message: "Shower type updated successfully",
    });
  } catch (error) {
    console.error("Error updating shower type:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update shower type" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a shower type
export async function DELETE(
  request: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createUnauthorizedResponse();
    }

    const params = await segmentData.params;
    const { id } = params;

    const existingShowerType = await prisma.showerType.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            categories: true,
            UserDesign: true,
          },
        },
      },
    });

    if (!existingShowerType) {
      return NextResponse.json(
        { success: false, message: "Shower type not found" },
        { status: 404 }
      );
    }

    // Prevent deletion if shower type has categories or user designs
    if (
      existingShowerType._count.categories > 0 ||
      existingShowerType._count.UserDesign > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot delete shower type that has categories or user designs. Please remove them first.",
        },
        { status: 400 }
      );
    }

    await prisma.showerType.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      success: true,
      message: "Shower type deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting shower type:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete shower type" },
      { status: 500 }
    );
  }
}
