// src/app/api/template-subcategories/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

type Params = Promise<{ id: string }>;

// GET - Fetch a specific template subcategory by ID
export async function GET(
  request: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const params = await segmentData.params;
    const { id } = params;

    const templateSubcategory = await prisma.templateSubcategory.findUnique({
      where: { id: parseInt(id) },
      include: {
        templateProducts: {
          include: {
            templateVariants: true,
          },
        },
        templateCategory: {
          select: {
            id: true,
            name: true,
            slug: true,
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
      return NextResponse.json(
        { success: false, message: "Template subcategory not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: templateSubcategory,
    });
  } catch (error) {
    console.error("Error fetching template subcategory:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch template subcategory" },
      { status: 500 }
    );
  }
}

// PUT - Update a template subcategory
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
    const body = await request.json();
    const { name, slug, description } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, message: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Check if template subcategory exists
    const existingSubcategory = await prisma.templateSubcategory.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingSubcategory) {
      return NextResponse.json(
        { success: false, message: "Template subcategory not found" },
        { status: 404 }
      );
    }

    // Check if slug is being changed and if it's already taken in the same category
    if (slug !== existingSubcategory.slug) {
      const duplicate = await prisma.templateSubcategory.findFirst({
        where: {
          slug,
          templateCategoryId: existingSubcategory.templateCategoryId,
          id: { not: parseInt(id) },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Template subcategory with this slug already exists in this category",
          },
          { status: 409 }
        );
      }
    }

    const updatedSubcategory = await prisma.templateSubcategory.update({
      where: { id: parseInt(id) },
      data: {
        name,
        slug,
        description: description || null,
      },
      include: {
        templateProducts: {
          include: {
            templateVariants: true,
          },
        },
        templateCategory: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedSubcategory,
      message: "Template subcategory updated successfully",
    });
  } catch (error) {
    console.error("Error updating template subcategory:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update template subcategory" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a template subcategory
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

    const existingSubcategory = await prisma.templateSubcategory.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            templateProducts: true,
            subcategories: true,
          },
        },
      },
    });

    if (!existingSubcategory) {
      return NextResponse.json(
        { success: false, message: "Template subcategory not found" },
        { status: 404 }
      );
    }

    // Prevent deletion if subcategory has products or subcategories
    if (
      existingSubcategory._count.templateProducts > 0 ||
      existingSubcategory._count.subcategories > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot delete subcategory that has products or subcategories. Please remove them first.",
        },
        { status: 400 }
      );
    }

    await prisma.templateSubcategory.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      success: true,
      message: "Template subcategory deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting template subcategory:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete template subcategory" },
      { status: 500 }
    );
  }
}
