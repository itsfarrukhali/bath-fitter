// app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface ProductCreateData {
  name: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
  categoryId: number;
  subcategoryId?: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const subcategoryId = searchParams.get("subcategoryId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const whereClause: Prisma.ProductWhereInput = {};

    if (categoryId) whereClause.categoryId = parseInt(categoryId);
    if (subcategoryId) whereClause.subcategoryId = parseInt(subcategoryId);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          category: {
            select: { id: true, name: true, slug: true, showerTypeId: true },
          },
          subcategory: {
            select: { id: true, name: true, slug: true },
          },
          variants: {
            orderBy: { colorName: "asc" },
          },
          _count: {
            select: { variants: true },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createUnauthorizedResponse();
    }

    const body: ProductCreateData = await request.json();
    const { name, slug, description, thumbnailUrl, categoryId, subcategoryId } =
      body;

    if (!name?.trim() || !slug?.trim() || !categoryId) {
      return NextResponse.json(
        { success: false, message: "Name, slug, and categoryId are required" },
        { status: 400 }
      );
    }

    // Validate category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { showerType: true },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }

    // Validate subcategory if provided
    if (subcategoryId) {
      const subcategory = await prisma.subcategory.findUnique({
        where: { id: subcategoryId, categoryId },
      });
      if (!subcategory) {
        return NextResponse.json(
          { success: false, message: "Subcategory not found in this category" },
          { status: 404 }
        );
      }
    }

    // Check for duplicate slug
    const existingProduct = await prisma.product.findFirst({
      where: {
        slug: slug.trim(),
        OR: [
          { categoryId, subcategoryId: null },
          { subcategoryId: subcategoryId || undefined },
        ],
      },
    });

    if (existingProduct) {
      return NextResponse.json(
        { success: false, message: "Product with this slug already exists" },
        { status: 409 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        slug: slug.trim(),
        description: description?.trim() || null,
        thumbnailUrl: thumbnailUrl?.trim() || null,
        categoryId,
        subcategoryId: subcategoryId || null,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true, showerType: true },
        },
        subcategory: {
          select: { id: true, name: true, slug: true },
        },
        variants: true,
        _count: { select: { variants: true } },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: product,
        message: "Product created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create product" },
      { status: 500 }
    );
  }
}
