// app/api/template-subcategories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateCategoryId = searchParams.get("templateCategoryId");

    if (!templateCategoryId) {
      return NextResponse.json(
        { success: false, message: "templateCategoryId is required" },
        { status: 400 }
      );
    }

    const templateSubcategories = await prisma.templateSubcategory.findMany({
      where: { templateCategoryId: parseInt(templateCategoryId) },
      include: {
        templateProducts: {
          include: {
            templateVariants: true,
          },
        },
        _count: {
          select: {
            templateProducts: true,
            subcategories: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: templateSubcategories,
    });
  } catch (error) {
    console.error("Error fetching template subcategories:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch template subcategories" },
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
    const { name, slug, description, templateCategoryId } = body;

    if (!name || !slug || !templateCategoryId) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, slug, and templateCategoryId are required",
        },
        { status: 400 }
      );
    }

    // Check if template category exists
    const templateCategory = await prisma.templateCategory.findUnique({
      where: { id: templateCategoryId },
    });

    if (!templateCategory) {
      return NextResponse.json(
        { success: false, message: "Template category not found" },
        { status: 404 }
      );
    }

    // Check for duplicate slug in same template category
    const existingSubcategory = await prisma.templateSubcategory.findFirst({
      where: {
        slug,
        templateCategoryId,
      },
    });

    if (existingSubcategory) {
      return NextResponse.json(
        {
          success: false,
          message: "Template subcategory with this slug already exists",
        },
        { status: 409 }
      );
    }

    const templateSubcategory = await prisma.templateSubcategory.create({
      data: {
        name,
        slug,
        description,
        templateCategoryId,
      },
      include: {
        templateProducts: {
          include: {
            templateVariants: true,
          },
        },
        _count: {
          select: {
            templateProducts: true,
            subcategories: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: templateSubcategory,
        message: "Template subcategory created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating template subcategory:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create template subcategory" },
      { status: 500 }
    );
  }
}
