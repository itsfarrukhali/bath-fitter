import { NextRequest, NextResponse } from "next/server";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  createPaginatedResponse,
  createSuccessResponse,
  parsePaginationParams,
} from "@/lib/api-response";
import { handleApiError, NotFoundError, ConflictError } from "@/lib/error-handler";
import { templateSubcategoryCreateSchema } from "@/schemas/api-schemas";
import { validateData, sanitizeSearchQuery } from "@/lib/validation";

/**
 * GET /api/template-subcategories
 * Fetch template subcategories with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePaginationParams(searchParams);
    const templateCategoryId = searchParams.get("templateCategoryId");
    const search = sanitizeSearchQuery(searchParams.get("search"));

    // Build where clause
    const whereClause: Prisma.TemplateSubcategoryWhereInput = {};

    if (templateCategoryId) {
      whereClause.templateCategoryId = parseInt(templateCategoryId);
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch template subcategories
    const [templateSubcategories, total] = await Promise.all([
      prisma.templateSubcategory.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          templateCategory: {
            select: {
              id: true,
              name: true,
              slug: true,
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
      }),
      prisma.templateSubcategory.count({ where: whereClause }),
    ]);

    return createPaginatedResponse(
      templateSubcategories,
      { page, limit, total },
      search ? `Found ${total} template subcategory(ies)` : undefined
    );
  } catch (error) {
    return handleApiError(error, "GET /api/template-subcategories");
  }
}

/**
 * POST /api/template-subcategories
 * Create a new template subcategory
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
    const validation = validateData(templateSubcategoryCreateSchema, body);

    if (!validation.success) {
      throw validation.errors;
    }

    const { name, slug, description, templateCategoryId } = validation.data;

    // Validate template category exists
    const templateCategory = await prisma.templateCategory.findUnique({
      where: { id: templateCategoryId },
    });

    if (!templateCategory) {
      throw new NotFoundError("Template category");
    }

    // Check for duplicate slug in same template category
    const existingSubcategory = await prisma.templateSubcategory.findFirst({
      where: {
        slug,
        templateCategoryId,
      },
    });

    if (existingSubcategory) {
      throw new ConflictError(
        "Template subcategory with this slug already exists in this template category"
      );
    }

    // Create template subcategory
    const templateSubcategory = await prisma.templateSubcategory.create({
      data: {
        name,
        slug,
        description: description || null,
        templateCategoryId,
      },
      include: {
        templateCategory: {
          select: {
            id: true,
            name: true,
            slug: true,
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

    return createSuccessResponse(
      templateSubcategory,
      "Template subcategory created successfully",
      201
    );
  } catch (error) {
    return handleApiError(error, "POST /api/template-subcategories");
  }
}
