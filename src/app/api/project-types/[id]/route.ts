// app/api/project-types/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ProjectTypeUpdateData } from "@/types/project-type";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";

type Params = Promise<{ id: string }>;

// GET - Fetch a specific project type by ID
export async function GET(
  _request: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const params = await segmentData.params;
    const { id } = params;

    const projectType = await prisma.projectType.findUnique({
      where: { id: parseInt(id) },
      include: {
        showerTypes: {
          include: {
            _count: {
              select: {
                categories: true,
                UserDesign: true,
              },
            },
          },
        },
        _count: {
          select: {
            showerTypes: true,
          },
        },
      },
    });

    if (!projectType) {
      return NextResponse.json(
        { success: false, message: "Project type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: projectType,
    });
  } catch (error) {
    console.error("Error fetching project type:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch project type" },
      { status: 500 }
    );
  }
}

// PUT - Update a project type
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
    const body: ProjectTypeUpdateData = await request.json();
    const { name, slug } = body;

    // Check if project type exists
    const existingProjectType = await prisma.projectType.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingProjectType) {
      return NextResponse.json(
        { success: false, message: "Project type not found" },
        { status: 404 }
      );
    }

    // Check if slug is being changed and if it's already taken
    if (slug && slug !== existingProjectType.slug) {
      const duplicate = await prisma.projectType.findFirst({
        where: {
          slug,
          id: { not: parseInt(id) }, // exclude current project type
        },
      });

      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            message: "Project type with this slug already exists",
          },
          { status: 409 }
        );
      }
    }

    const updatedProjectType = await prisma.projectType.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
      },
      include: {
        _count: {
          select: {
            showerTypes: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedProjectType,
      message: "Project type updated successfully",
    });
  } catch (error) {
    console.error("Error updating project type:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update project type" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a project type
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

    const existingProjectType = await prisma.projectType.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            showerTypes: true,
          },
        },
      },
    });

    if (!existingProjectType) {
      return NextResponse.json(
        { success: false, message: "Project type not found" },
        { status: 404 }
      );
    }

    // Prevent deletion if project type has shower types
    if (existingProjectType._count.showerTypes > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot delete project type that has shower types. Please remove them first.",
        },
        { status: 400 }
      );
    }

    await prisma.projectType.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      success: true,
      message: "Project type deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting project type:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete project type" },
      { status: 500 }
    );
  }
}
