import { NextRequest } from "next/server";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  createPaginatedResponse,
  createSuccessResponse,
  parsePaginationParams,
} from "@/lib/api-response";
import { handleApiError, ConflictError } from "@/lib/error-handler";
import { templateCategoryCreateSchema } from "@/schemas/api-schemas";
import { validateData, sanitizeSearchQuery } from "@/lib/validation";

/**
 * GET /api/template-categories
 * Fetch template categories with pagination and search
 * Public endpoint for browsing templates
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePaginationParams(searchParams);
    const search = sanitizeSearchQuery(searchParams.get("search"));
    const isActive = searchParams.get("isActive");

    // Build where clause
    const whereClause: Prisma.TemplateCategoryWhereInput = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isActive !== null && isActive !== undefined) {
      whereClause.isActive = isActive === "true";
    }

    // Fetch templates with counts
    const [templates, total] = await Promise.all([
      prisma.templateCategory.findMany({
        where: whereClause,
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
      prisma.templateCategory.count({ where: whereClause }),
    ]);

    return createPaginatedResponse(
      templates,
      { page, limit, total },
      search ? `Found ${total} template(s)` : undefined
    );
  } catch (error) {
    return handleApiError(error, "GET /api/template-categories");
  }
}

/**
 * POST /api/template-categories
 * Create a new template category
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
    const validation = validateData(templateCategoryCreateSchema, body);

    if (!validation.success) {
      throw validation.errors;
    }

    const { name, slug, description, isActive } = validation.data;

    // Check for duplicate slug
    const existingTemplate = await prisma.templateCategory.findUnique({
      where: { slug },
    });

    if (existingTemplate) {
      throw new ConflictError("Template with this slug already exists");
    }

    // Create template category
    const template = await prisma.templateCategory.create({
      data: {
        name,
        slug,
        description: description || null,
        isActive: isActive ?? true,
      },
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

    return createSuccessResponse(
      template,
      "Template category created successfully",
      201
    );
  } catch (error) {
    return handleApiError(error, "POST /api/template-categories");
  }
}
