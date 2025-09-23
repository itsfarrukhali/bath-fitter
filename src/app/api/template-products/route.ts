// app/api/template-products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateCategoryId = searchParams.get("templateCategoryId");
    const templateSubcategoryId = searchParams.get("templateSubcategoryId");

    const whereClause: any = {};
    if (templateCategoryId)
      whereClause.templateCategoryId = parseInt(templateCategoryId);
    if (templateSubcategoryId)
      whereClause.templateSubcategoryId = parseInt(templateSubcategoryId);

    const templateProducts = await prisma.templateProduct.findMany({
      where: whereClause,
      include: {
        templateVariants: true,
        templateCategory: {
          select: { id: true, name: true, slug: true },
        },
        templateSubcategory: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: {
            templateVariants: true,
            products: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: templateProducts,
    });
  } catch (error) {
    console.error("Error fetching template products:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch template products" },
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

    const body = await request.json();
    const {
      name,
      slug,
      description,
      thumbnailUrl,
      templateCategoryId,
      templateSubcategoryId,
    } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, message: "Name and slug are required" },
        { status: 400 }
      );
    }

    if (!templateCategoryId && !templateSubcategoryId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Either templateCategoryId or templateSubcategoryId is required",
        },
        { status: 400 }
      );
    }

    // Check parent exists
    if (templateCategoryId) {
      const templateCategory = await prisma.templateCategory.findUnique({
        where: { id: templateCategoryId },
      });
      if (!templateCategory) {
        return NextResponse.json(
          { success: false, message: "Template category not found" },
          { status: 404 }
        );
      }
    }

    if (templateSubcategoryId) {
      const templateSubcategory = await prisma.templateSubcategory.findUnique({
        where: { id: templateSubcategoryId },
      });
      if (!templateSubcategory) {
        return NextResponse.json(
          { success: false, message: "Template subcategory not found" },
          { status: 404 }
        );
      }
    }

    // Check for duplicate slug
    const existingProduct = await prisma.templateProduct.findFirst({
      where: {
        slug,
        OR: [
          { templateCategoryId: templateCategoryId || undefined },
          { templateSubcategoryId: templateSubcategoryId || undefined },
        ],
      },
    });

    if (existingProduct) {
      return NextResponse.json(
        {
          success: false,
          message: "Template product with this slug already exists",
        },
        { status: 409 }
      );
    }

    const templateProduct = await prisma.templateProduct.create({
      data: {
        name,
        slug,
        description,
        thumbnailUrl: thumbnailUrl || null, // Save thumbnail
        templateCategoryId,
        templateSubcategoryId,
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

    return NextResponse.json(
      {
        success: true,
        data: templateProduct,
        message: "Template product created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating template product:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create template product" },
      { status: 500 }
    );
  }
}
