// app/api/subcategories/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SubcategoryCreateData } from "@/types/subcategory";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";

// GET - Fetch paginated subcategories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const categoryId = searchParams.get("categoryId");
    const skip = (page - 1) * limit;

    const whereClause = categoryId ? { categoryId: parseInt(categoryId) } : {};

    const [subcategories, total] = await Promise.all([
      prisma.subcategory.findMany({
        where: whereClause,
        skip,
        take: limit,
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
        orderBy: { name: "asc" },
      }),
      prisma.subcategory.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      data: subcategories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch subcategories" },
      { status: 500 }
    );
  }
}

// POST - Create a new subcategory
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createUnauthorizedResponse();
    }

    const body: SubcategoryCreateData = await request.json();
    const { name, slug, categoryId } = body;

    // Validation
    if (!name || !slug || !categoryId) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, slug, and categoryId are required",
        },
        { status: 400 }
      );
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }

    // Check for existing subcategory with same slug within the same category
    const existingSubcategory = await prisma.subcategory.findFirst({
      where: { slug, categoryId },
    });

    if (existingSubcategory) {
      return NextResponse.json(
        {
          success: false,
          message: "Subcategory with this slug already exists in this category",
        },
        { status: 409 }
      );
    }

    const subcategory = await prisma.subcategory.create({
      data: {
        name,
        slug,
        categoryId,
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

    return NextResponse.json(
      {
        success: true,
        data: subcategory,
        message: "Subcategory created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating subcategory:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create subcategory" },
      { status: 500 }
    );
  }
}
