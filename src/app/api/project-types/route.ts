// app/api/project-types/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ProjectTypeCreateData } from "@/types/project-type";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";

// GET - Fetch paginated project types
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Add cache control for public API
    const cacheControl = "public, s-maxage=3600, stale-while-revalidate=86400";

    const [projectTypes, total] = await Promise.all([
      prisma.projectType.findMany({
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              showerTypes: true,
            },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.projectType.count(),
    ]);

    const response = NextResponse.json({
      success: true,
      data: projectTypes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

    // Set cache headers
    response.headers.set("Cache-Control", cacheControl);
    return response;
  } catch (error) {
    console.error("Error fetching project types:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch project types" },
      { status: 500 }
    );
  }
}

// POST - Create a new project type
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createUnauthorizedResponse();
    }

    const body: ProjectTypeCreateData = await request.json();
    const { name, slug } = body;

    // Validation
    if (!name || !slug) {
      return NextResponse.json(
        {
          success: false,
          message: "Name and slug are required",
        },
        { status: 400 }
      );
    }

    // Check for existing project type with same slug
    const existingProjectType = await prisma.projectType.findUnique({
      where: { slug },
    });

    if (existingProjectType) {
      return NextResponse.json(
        {
          success: false,
          message: "Project type with this slug already exists",
        },
        { status: 409 }
      );
    }

    const projectType = await prisma.projectType.create({
      data: {
        name,
        slug,
      },
      include: {
        _count: {
          select: {
            showerTypes: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: projectType,
        message: "Project type created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating project type:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create project type" },
      { status: 500 }
    );
  }
}
