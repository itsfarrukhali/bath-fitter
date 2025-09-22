// app/api/categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CategoryCreateData } from "@/types/category";
import { getAuthenticatedUser, createUnauthorizedResponse } from "@/lib/auth";

// GET - Fetch paginated categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const showerTypeId = searchParams.get("showerTypeId");
    const skip = (page - 1) * limit;

    const whereClause = showerTypeId
      ? { showerTypeId: parseInt(showerTypeId) }
      : {};

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where: whereClause,
        skip,
        take: limit,
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
        orderBy: { name: "asc" },
      }),
      prisma.category.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      data: categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST - Create a new category
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createUnauthorizedResponse();
    }

    const body: CategoryCreateData = await request.json();
    const { name, slug, hasSubcategories, showerTypeId } = body;

    // Validation
    if (!name || !slug || !showerTypeId) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, slug, and showerTypeId are required",
        },
        { status: 400 }
      );
    }

    // Check if shower type exists
    const showerType = await prisma.showerType.findUnique({
      where: { id: showerTypeId },
    });

    if (!showerType) {
      return NextResponse.json(
        { success: false, message: "Shower type not found" },
        { status: 404 }
      );
    }

    // Check for existing category with same slug within the same shower type
    const existingCategory = await prisma.category.findFirst({
      where: { slug, showerTypeId },
    });

    if (existingCategory) {
      return NextResponse.json(
        { success: false, message: "Category with this slug already exists" },
        { status: 409 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        hasSubcategories: hasSubcategories || false,
        showerTypeId,
      },
      include: {
        showerType: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        subcategories: true,
        _count: {
          select: {
            subcategories: true,
            products: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: category,
        message: "Category created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create category" },
      { status: 500 }
    );
  }
}
