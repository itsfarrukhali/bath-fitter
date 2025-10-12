// app/api/categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CategoryCreateData } from "@/types/category";
import { getAuthenticatedUser, createUnauthorizedResponse } from "@/lib/auth";

// GET - Fetch paginated categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const showerTypeId = searchParams.get("showerTypeId");
    const includeProducts = searchParams.get("includeProducts") === "true";
    const forAdmin = searchParams.get("forAdmin") === "true";

    // If forAdmin=true, return all categories without showerTypeId requirement
    if (forAdmin) {
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "6");
      const skip = (page - 1) * limit;

      // Get total count for pagination
      const totalCount = await prisma.category.count();

      const categories = await prisma.category.findMany({
        skip,
        take: limit,
        include: {
          showerType: {
            select: { id: true, name: true, slug: true },
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
              products: true,
              subcategories: true,
            },
          },
        },
        orderBy: { name: "asc" },
      });

      const totalPages = Math.ceil(totalCount / limit);

      return NextResponse.json({
        success: true,
        data: categories,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
        },
      });
    }

    // Original logic for customer-facing API - UPDATED WITH Z_INDEX
    if (!showerTypeId) {
      return NextResponse.json(
        {
          success: false,
          message: "showerTypeId is required for customer-facing API",
        },
        { status: 400 }
      );
    }

    const categories = await prisma.category.findMany({
      where: {
        showerTypeId: parseInt(showerTypeId),
        ...(includeProducts && {
          products: {
            some: {}, // Only categories that have products
          },
        }),
      },
      include: {
        showerType: {
          select: { id: true, name: true, slug: true },
        },
        subcategories: includeProducts
          ? {
              include: {
                products: {
                  include: {
                    variants: {
                      orderBy: { colorName: "asc" },
                    },
                  },
                  where: {
                    variants: {
                      some: {}, // Only products that have variants
                    },
                  },
                },
              },
            }
          : {
              select: {
                id: true,
                name: true,
                slug: true,
                z_index: true, // Ensure z_index included
                categoryId: true,
              },
            },
        products: includeProducts
          ? {
              include: {
                variants: {
                  orderBy: { colorName: "asc" },
                },
              },
              where: {
                variants: {
                  some: {}, // Only products that have variants
                },
              },
            }
          : {
              select: {
                id: true,
                name: true,
                slug: true,
                z_index: true,
                categoryId: true,
              },
            },
      },
      orderBy: { name: "asc" },
    });

    // Type-safe filter function
    interface SubcategoryWithProducts {
      products?: Array<{ variants: Array<unknown> }>;
      z_index?: number | null;
    }

    interface CategoryWithRelations {
      products?: Array<{ z_index?: number | null }>;
      subcategories?: SubcategoryWithProducts[];
      z_index?: number | null;
    }

    // Filter out categories that have no products after including variants condition
    const filteredCategories = (categories as CategoryWithRelations[]).filter(
      (category) => {
        const hasDirectProducts =
          category.products && category.products.length > 0;

        const hasSubcategoryProducts = category.subcategories?.some(
          (sub) => sub.products && sub.products.length > 0
        );

        return hasDirectProducts || hasSubcategoryProducts;
      }
    );

    return NextResponse.json({
      success: true,
      data: filteredCategories,
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
    const { name, slug, hasSubcategories, showerTypeId, templateId, z_index } =
      body;

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

    // If using template, verify it exists
    if (templateId) {
      const template = await prisma.templateCategory.findUnique({
        where: { id: templateId },
      });
      if (!template) {
        return NextResponse.json(
          { success: false, message: "Template not found" },
          { status: 404 }
        );
      }
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

    // Check for existing category with same slug in this shower type
    const existingCategory = await prisma.category.findFirst({
      where: { slug, showerTypeId },
    });
    if (existingCategory) {
      return NextResponse.json(
        {
          success: false,
          message: "Category with this slug already exists in this shower type",
        },
        { status: 409 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        hasSubcategories: hasSubcategories || false,
        showerTypeId,
        templateId,
        z_index: z_index || 50, // Default to 50 if not provided
      },
      include: {
        showerType: { select: { id: true, name: true, slug: true } },
        template: { select: { id: true, name: true, slug: true } },
        _count: { select: { subcategories: true, products: true } },
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
