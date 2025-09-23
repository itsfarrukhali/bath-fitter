// src/app/api/template-products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

type Params = Promise<{ id: string }>;

// GET - Fetch a specific template product by ID
export async function GET(
  _request: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const params = await segmentData.params;
    const { id } = params;

    const templateProduct = await prisma.templateProduct.findUnique({
      where: { id: parseInt(id) },
      include: {
        templateCategory: { select: { id: true, name: true, slug: true } },
        templateSubcategory: { select: { id: true, name: true, slug: true } },
        templateVariants: true,
        _count: { select: { templateVariants: true, products: true } },
      },
    });

    if (!templateProduct) {
      return NextResponse.json(
        { success: false, message: "Template product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: templateProduct });
  } catch (error) {
    console.error("Error fetching template product:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch template product" },
      { status: 500 }
    );
  }
}

// PUT - Update a template product
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

    // Check if product exists
    const existingProduct = await prisma.templateProduct.findUnique({
      where: { id: parseInt(id) },
      include: {
        templateCategory: true,
        templateSubcategory: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, message: "Template product not found" },
        { status: 404 }
      );
    }

    // Check if slug is being changed and if it's already taken in the same parent
    if (slug !== existingProduct.slug) {
      const duplicate = await prisma.templateProduct.findFirst({
        where: {
          slug,
          OR: [
            { templateCategoryId: existingProduct.templateCategoryId },
            { templateSubcategoryId: existingProduct.templateSubcategoryId },
          ],
          id: { not: parseInt(id) },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Template product with this slug already exists in this category/subcategory",
          },
          { status: 409 }
        );
      }
    }

    const updatedProduct = await prisma.templateProduct.update({
      where: { id: parseInt(id) },
      data: {
        name,
        slug,
        description: description || null,
      },
      include: {
        templateVariants: true,
        templateCategory: {
          select: { id: true, name: true, slug: true },
        },
        templateSubcategory: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedProduct,
      message: "Template product updated successfully",
    });
  } catch (error) {
    console.error("Error updating template product:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update template product" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a template product
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

    const existingProduct = await prisma.templateProduct.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            templateVariants: true,
            products: true,
          },
        },
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, message: "Template product not found" },
        { status: 404 }
      );
    }

    // Prevent deletion if product has variants or instances
    if (
      existingProduct._count.templateVariants > 0 ||
      existingProduct._count.products > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot delete product that has variants or instances. Please remove them first.",
        },
        { status: 400 }
      );
    }

    await prisma.templateProduct.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      success: true,
      message: "Template product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting template product:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete template product" },
      { status: 500 }
    );
  }
}
