import { NextRequest, } from "next/server";
import prisma from "@/lib/prisma";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";
import {
  createPaginatedResponse,
  createSuccessResponse,
  parsePaginationParams,
  addCacheHeaders,
} from "@/lib/api-response";
import { handleApiError, ConflictError } from "@/lib/error-handler";
import { projectTypeCreateSchema } from "@/schemas/api-schemas";
import { validateData, sanitizeSearchQuery } from "@/lib/validation";

/**
 * GET /api/project-types
 * Fetch paginated project types with optional search
 * Public endpoint with caching
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePaginationParams(searchParams);
    const search = sanitizeSearchQuery(searchParams.get("search"));

    // Build where clause for search
    const whereClause = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { slug: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    // Fetch project types with counts
    const [projectTypes, total] = await Promise.all([
      prisma.projectType.findMany({
        where: whereClause,
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
      prisma.projectType.count({ where: whereClause }),
    ]);

    const response = createPaginatedResponse(
      projectTypes,
      { page, limit, total },
      search ? `Found ${total} project type(s)` : undefined
    );

    // Add cache headers for public API
    return addCacheHeaders(response, 3600);
  } catch (error) {
    return handleApiError(error, "GET /api/project-types");
  }
}

/**
 * POST /api/project-types
 * Create a new project type
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
    const validation = validateData(projectTypeCreateSchema, body);

    if (!validation.success) {
      throw validation.errors;
    }

    const { name, slug } = validation.data;

    // Check for existing project type with same slug
    const existingProjectType = await prisma.projectType.findUnique({
      where: { slug },
    });

    if (existingProjectType) {
      throw new ConflictError("Project type with this slug already exists");
    }

    // Create project type
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

    return createSuccessResponse(
      projectType,
      "Project type created successfully",
      201
    );
  } catch (error) {
    return handleApiError(error, "POST /api/project-types");
  }
}
