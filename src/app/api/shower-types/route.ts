import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";
import {
  createPaginatedResponse,
  createSuccessResponse,
  parsePaginationParams,
  addCacheHeaders,
} from "@/lib/api-response";
import { handleApiError, NotFoundError, ConflictError } from "@/lib/error-handler";
import { showerTypeCreateSchema } from "@/schemas/api-schemas";
import { validateData, sanitizeSearchQuery } from "@/lib/validation";

/**
 * GET /api/shower-types
 * Fetch paginated shower types with optional filtering and search
 * Public endpoint with caching
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePaginationParams(searchParams);
    const projectTypeId = searchParams.get("projectTypeId");
    const search = sanitizeSearchQuery(searchParams.get("search"));

    // Input validation for projectTypeId
    if (projectTypeId && isNaN(parseInt(projectTypeId))) {
      throw new Error("Invalid projectTypeId");
    }

    // Build where clause
    const whereClause: {
      projectTypeId?: number;
      OR?: Array<{ name: { contains: string; mode: "insensitive" } } | { slug: { contains: string; mode: "insensitive" } }>;
    } = {};

    if (projectTypeId) {
      whereClause.projectTypeId = parseInt(projectTypeId);
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" as const } },
        { slug: { contains: search, mode: "insensitive" as const } },
      ];
    }

    // Fetch shower types with counts
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

    const response = createPaginatedResponse(
      showerTypes,
      { page, limit, total },
      search ? `Found ${total} shower type(s)` : undefined
    );

    // Add cache headers for public API
    return addCacheHeaders(response, 3600);
  } catch (error) {
    return handleApiError(error, "GET /api/shower-types");
  }
}

/**
 * POST /api/shower-types
 * Create a new shower type
 * Protected endpoint - requires authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createUnauthorizedResponse();
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = validateData(showerTypeCreateSchema, body);

    if (!validation.success) {
      throw validation.errors;
    }

    const { name, slug, projectTypeId, imageUrl, baseImageLeft, baseImageRight } = validation.data;

    // Check if project type exists
    const projectType = await prisma.projectType.findUnique({
      where: { id: projectTypeId },
    });

    if (!projectType) {
      throw new NotFoundError("Project type");
    }

    // Check for existing shower type with same slug
    const existingShowerType = await prisma.showerType.findUnique({
      where: { slug },
    });

    if (existingShowerType) {
      throw new ConflictError("Shower type with this slug already exists");
    }

    // Create shower type
    const showerType = await prisma.showerType.create({
      data: {
        name,
        slug,
        projectTypeId,
        imageUrl: imageUrl || null,
        baseImageLeft: baseImageLeft || null,
        baseImageRight: baseImageRight || null,
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

    return createSuccessResponse(
      showerType,
      "Shower type created successfully",
      201
    );
  } catch (error) {
    return handleApiError(error, "POST /api/shower-types");
  }
}

