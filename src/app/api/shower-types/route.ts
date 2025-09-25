// app/api/shower-types/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ShowerTypeCreateData } from "@/types/shower-types";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";

// GET - Fetch paginated shower types
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const projectTypeId = searchParams.get("projectTypeId");
    const skip = (page - 1) * limit;
    const cacheControl = "public, s-maxage=3600, stale-while-revalidate=86400";
    // Input validation
    if (projectTypeId && isNaN(parseInt(projectTypeId))) {
      return NextResponse.json(
        { success: false, message: "Invalid projectTypeId" },
        { status: 400 }
      );
    }

    const whereClause = projectTypeId
      ? { projectTypeId: parseInt(projectTypeId) }
      : {};

    const [showerTypes, total] = await Promise.all([
      prisma.showerType.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          projectType: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          categories: {
            include: {
              _count: {
                select: {
                  subcategories: true,
                  products: true,
                },
              },
            },
          },
          _count: {
            select: {
              categories: true,
              userDesigns: true,
            },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.showerType.count({ where: whereClause }),
    ]);

    const response = NextResponse.json({
      success: true,
      data: showerTypes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

    response.headers.set("Cache-Control", cacheControl);

    return response;
  } catch (error) {
    console.error("Error fetching shower types:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch shower types" },
      { status: 500 }
    );
  }
}

// POST - Create a new shower type
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createUnauthorizedResponse();
    }

    const body: ShowerTypeCreateData = await request.json();
    const { name, slug, projectTypeId, baseImage } = body;

    // Validation
    if (!name || !slug || !projectTypeId) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, slug, and projectTypeId are required",
        },
        { status: 400 }
      );
    }

    // Check if project type exists
    const projectType = await prisma.projectType.findUnique({
      where: { id: projectTypeId },
    });

    if (!projectType) {
      return NextResponse.json(
        { success: false, message: "Project type not found" },
        { status: 404 }
      );
    }

    // Check for existing shower type with same slug
    const existingShowerType = await prisma.showerType.findUnique({
      where: { slug },
    });

    if (existingShowerType) {
      return NextResponse.json(
        {
          success: false,
          message: "Shower type with this slug already exists",
        },
        { status: 409 }
      );
    }

    const showerType = await prisma.showerType.create({
      data: {
        name,
        slug,
        projectTypeId,
        baseImage,
      },
      include: {
        projectType: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        categories: {
          include: {
            _count: {
              select: {
                subcategories: true,
                products: true,
              },
            },
          },
        },
        _count: {
          select: {
            categories: true,
            userDesigns: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: showerType,
        message: "Shower type created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating shower type:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create shower type" },
      { status: 500 }
    );
  }
}
