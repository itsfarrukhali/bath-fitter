// app/api/subcategories/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SubcategoryUpdateData } from "@/types/subcategory";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";

type Params = Promise<{ id: string }>;

// GET - Fetch a specific subcategory by ID
export async function GET(
  _request: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const params = await segmentData.params;
    const { id } = params;

    const subcategory = await prisma.subcategory.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        products: {
          include: {
            variants: true,
            _count: {
              select: { variants: true },
            },
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!subcategory) {
      return NextResponse.json(
        { success: false, message: "Subcategory not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: subcategory,
    });
  } catch (error) {
    console.error("Error fetching subcategory:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch subcategory" },
      { status: 500 }
    );
  }
}

// PUT - Update a subcategory
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
    const body: SubcategoryUpdateData = await request.json();
    const { name, slug, categoryId } = body;

    // Check if subcategory exists
    const existingSubcategory = await prisma.subcategory.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingSubcategory) {
      return NextResponse.json(
        { success: false, message: "Subcategory not found" },
        { status: 404 }
      );
    }

    // Check if category exists if being updated
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        return NextResponse.json(
          { success: false, message: "Category not found" },
          { status: 404 }
        );
      }
    }

    // Check if slug is being changed and if it's already taken
    if (slug && slug !== existingSubcategory.slug) {
      const duplicate = await prisma.subcategory.findFirst({
        where: {
          slug,
          categoryId: categoryId || existingSubcategory.categoryId,
          id: { not: parseInt(id) }, // exclude current subcategory
        },
      });

      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Subcategory with this slug already exists in this category",
          },
          { status: 409 }
        );
      }
    }

    const updatedSubcategory = await prisma.subcategory.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(categoryId && { categoryId }),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
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
            products: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedSubcategory,
      message: "Subcategory updated successfully",
    });
  } catch (error) {
    console.error("Error updating subcategory:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update subcategory" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a subcategory
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

    const existingSubcategory = await prisma.subcategory.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!existingSubcategory) {
      return NextResponse.json(
        { success: false, message: "Subcategory not found" },
        { status: 404 }
      );
    }

    // Prevent deletion if subcategory has products
    if (existingSubcategory._count.products > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot delete subcategory that has products. Please remove them first.",
        },
        { status: 400 }
      );
    }

    await prisma.subcategory.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      success: true,
      message: "Subcategory deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting subcategory:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete subcategory" },
      { status: 500 }
    );
  }
}
