// app/api/template-categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { TemplateCreateData } from "@/types/template";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const [templates, total] = await Promise.all([
      prisma.templateCategory.findMany({
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              templateSubcategories: true,
              templateProducts: true,
              categories: true,
            },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.templateCategory.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: templates,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching template categories:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch template categories" },
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

    const body: TemplateCreateData = await request.json();
    const { name, slug, description } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, message: "Name and slug are required" },
        { status: 400 }
      );
    }

    const existingTemplate = await prisma.templateCategory.findUnique({
      where: { slug },
    });

    if (existingTemplate) {
      return NextResponse.json(
        { success: false, message: "Template with this slug already exists" },
        { status: 409 }
      );
    }

    const template = await prisma.templateCategory.create({
      data: { name, slug, description },
      include: {
        _count: {
          select: {
            templateSubcategories: true,
            templateProducts: true,
            categories: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: template,
        message: "Template created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating template category:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create template category" },
      { status: 500 }
    );
  }
}
