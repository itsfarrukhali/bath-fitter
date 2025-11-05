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
  z_index?: number | null;
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
            select: {
              id: true,
              name: true,
              slug: true,
              showerTypeId: true,
              z_index: true,
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
        orderBy: [{ z_index: "asc" }, { name: "asc" }],
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
    const {
      name,
      slug,
      description,
      thumbnailUrl,
      categoryId,
      subcategoryId,
      z_index,
    } = body;

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

    // Validate category exists and get its z_index
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

    // Validate subcategory if provided and get its z_index
    let subcategory = null;
    if (subcategoryId) {
      subcategory = await prisma.subcategory.findUnique({
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

    // Determine default z_index: use provided value, otherwise inherit from parent
    let finalZIndex: number | null = null;
    if (z_index !== undefined && z_index !== null) {
      finalZIndex = z_index;
    } else if (subcategory && subcategory.z_index !== null) {
      finalZIndex = subcategory.z_index;
    } else if (category.z_index !== null) {
      finalZIndex = category.z_index;
    } else {
      finalZIndex = 50;
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        slug: slug.trim(),
        description: description?.trim() || null,
        thumbnailUrl: thumbnailUrl?.trim() || null,
        categoryId,
        subcategoryId: subcategoryId || null,
        z_index: finalZIndex,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            showerType: true,
            z_index: true,
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
