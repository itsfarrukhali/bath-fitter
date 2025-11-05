// app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { deleteFromCloudinary } from "@/lib/cloudinary";

type Params = Promise<{ id: string }>;

export async function GET(
  request: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const params = await segmentData.params;
    const { id } = params;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            z_index: true,
            showerType: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        subcategory: {
          select: {
            id: true,
            name: true,
            slug: true,
            z_index: true,
          },
        },
        variants: {
          orderBy: { colorName: "asc" },
        },
        _count: {
          select: { variants: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

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
    const {
      name,
      slug,
      description,
      thumbnailUrl,
      categoryId,
      subcategoryId,
      z_index,
    } = body;

    const existingProduct = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    if (!name?.trim() || !slug?.trim() || !categoryId) {
      return NextResponse.json(
        { success: false, message: "Name, slug, and categoryId are required" },
        { status: 400 }
      );
    }

    // Validate z_index range if provided
    if (z_index !== undefined && z_index !== null) {
      if (z_index < 0 || z_index > 100) {
        return NextResponse.json(
          {
            success: false,
            message: "Z-Index must be between 0 and 100",
          },
          { status: 400 }
        );
      }
    }

    // Check for duplicate slug
    if (slug.trim() !== existingProduct.slug) {
      const duplicateProduct = await prisma.product.findFirst({
        where: {
          slug: slug.trim(),
          OR: [
            { categoryId, subcategoryId: null },
            { subcategoryId: subcategoryId || undefined },
          ],
          id: { not: parseInt(id) },
        },
      });

      if (duplicateProduct) {
        return NextResponse.json(
          { success: false, message: "Product with this slug already exists" },
          { status: 409 }
        );
      }
    }

    // Delete old thumbnail if changed
    if (
      thumbnailUrl &&
      thumbnailUrl !== existingProduct.thumbnailUrl &&
      existingProduct.thumbnailUrl
    ) {
      try {
        await deleteFromCloudinary(existingProduct.thumbnailUrl);
      } catch (error) {
        console.error("Failed to delete old thumbnail:", error);
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name: name.trim(),
        slug: slug.trim(),
        description: description?.trim() || null,
        thumbnailUrl: thumbnailUrl?.trim() || null,
        categoryId,
        subcategoryId: subcategoryId || null,
        ...(z_index !== undefined && { z_index }),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            z_index: true,
            showerType: { select: { id: true, name: true, slug: true } },
          },
        },
        subcategory: {
          select: {
            id: true,
            name: true,
            slug: true,
            z_index: true,
          },
        },
        variants: {
          orderBy: { colorName: "asc" },
        },
        _count: { select: { variants: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedProduct,
      message: "Product updated successfully",
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update product" },
      { status: 500 }
    );
  }
}

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

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: { variants: true },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    // Delete thumbnail
    if (product.thumbnailUrl) {
      try {
        await deleteFromCloudinary(product.thumbnailUrl);
      } catch (error) {
        console.error("Failed to delete product thumbnail:", error);
      }
    }

    // Delete variant images
    for (const variant of product.variants) {
      if (variant.publicId) {
        try {
          await deleteFromCloudinary(variant.publicId);
        } catch (error) {
          console.error(
            `Failed to delete variant image ${variant.publicId}:`,
            error
          );
        }
      }
    }

    await prisma.product.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete product" },
      { status: 500 }
    );
  }
}
