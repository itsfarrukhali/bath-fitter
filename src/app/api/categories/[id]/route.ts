// app/api/categories/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, createUnauthorizedResponse } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { CategoryUpdateData } from "@/types/category";

type Params = Promise<{ id: string }>;

// GET - Fetch a specific category by ID
export async function GET(
  _request: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const params = await segmentData.params;
    const { id } = params;

    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        showerType: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        subcategories: {
          include: {
            _count: {
              select: { products: true },
            },
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
            subcategories: true,
            products: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch category" },
      { status: 500 }
    );
  }
}

// PUT - Update a category
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
    const body: CategoryUpdateData = await request.json();
    const { name, slug, hasSubcategories, showerTypeId } = body;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }

    // Check if shower type exists if being updated
    if (showerTypeId) {
      const showerType = await prisma.showerType.findUnique({
        where: { id: showerTypeId },
      });

      if (!showerType) {
        return NextResponse.json(
          { success: false, message: "Shower type not found" },
          { status: 404 }
        );
      }
    }

    // Check if slug is being changed and if it's already taken
    if (slug && slug !== existingCategory.slug) {
      const duplicate = await prisma.category.findFirst({
        where: {
          slug,
          id: { not: parseInt(id) }, // exclude current category
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { success: false, message: "Category with this slug already exists" },
          { status: 409 }
        );
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(hasSubcategories !== undefined && { hasSubcategories }),
        ...(showerTypeId && { showerTypeId }),
      },
      include: {
        showerType: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        subcategories: {
          include: {
            _count: {
              select: { products: true },
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
    });

    return NextResponse.json({
      success: true,
      data: updatedCategory,
      message: "Category updated successfully",
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a category
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

    const existingCategory = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            subcategories: true,
            products: true,
          },
        },
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }

    // Prevent deletion if category has subcategories or products
    if (
      existingCategory._count.subcategories > 0 ||
      existingCategory._count.products > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot delete category that has subcategories or products. Please remove them first.",
        },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete category" },
      { status: 500 }
    );
  }
}
