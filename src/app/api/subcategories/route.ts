import { NextRequest } from "next/server";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma, PlumbingConfig } from "@prisma/client";
import {
  createPaginatedResponse,
  createSuccessResponse,
  parsePaginationParams,
} from "@/lib/api-response";
import { handleApiError, NotFoundError, ConflictError } from "@/lib/error-handler";
import { subcategoryCreateSchema } from "@/schemas/api-schemas";
import { validateData, sanitizeSearchQuery } from "@/lib/validation";

/**
 * GET /api/subcategories
 * Fetch subcategories with optional filtering and search
 * Supports filtering by category
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePaginationParams(searchParams);
    const categoryId = searchParams.get("categoryId");
    const search = sanitizeSearchQuery(searchParams.get("search"));

    // Build where clause
    const whereClause: Prisma.SubcategoryWhereInput = {};

    if (categoryId) {
      whereClause.categoryId = parseInt(categoryId);
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch subcategories with relations
    const [subcategories, total] = await Promise.all([
      prisma.subcategory.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              showerTypeId: true,
              z_index: true,
            },
          },
          template: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          products: {
            include: {
              _count: {
                select: { variants: true },
              },
            },
            orderBy: { z_index: "asc" },
          },
          _count: {
            select: { products: true },
          },
        },
        orderBy: [{ z_index: "asc" }, { name: "asc" }],
      }),
      prisma.subcategory.count({ where: whereClause }),
    ]);

    return createPaginatedResponse(
      subcategories,
      { page, limit, total },
      search ? `Found ${total} subcategory(ies)` : undefined
    );
  } catch (error) {
    return handleApiError(error, "GET /api/subcategories");
  }
}

/**
 * POST /api/subcategories
 * Create a new subcategory
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
    const validation = validateData(subcategoryCreateSchema, body);

    if (!validation.success) {
      throw validation.errors;
    }

    const { name, slug, categoryId, templateId, z_index, plumbingConfig } =
      validation.data;

    // Validate z_index range if provided
    if (z_index !== undefined && z_index !== null) {
      if (z_index < 0 || z_index > 100) {
        throw new Error("Z-Index must be between 0 and 100");
      }
    }

    // Validate category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundError("Category");
    }

    // Validate template if provided
    if (templateId) {
      const template = await prisma.templateSubcategory.findUnique({
        where: { id: templateId },
      });
      if (!template) {
        throw new NotFoundError("Template subcategory");
      }
    }

    // Check for duplicate slug in same category
    const existingSubcategory = await prisma.subcategory.findFirst({
      where: {
        slug,
        categoryId,
      },
    });

    if (existingSubcategory) {
      throw new ConflictError(
        "Subcategory with this slug already exists in this category"
      );
    }

    // Determine default z_index
    const finalZIndex = z_index ?? category.z_index ?? 50;

    // Create subcategory
    const subcategory = await prisma.subcategory.create({
      data: {
        name,
        slug,
        categoryId,
        templateId: templateId || null,
        z_index: finalZIndex,
        plumbingConfig: plumbingConfig || PlumbingConfig.LEFT,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            showerTypeId: true,
            z_index: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    return createSuccessResponse(
      subcategory,
      "Subcategory created successfully",
      201
    );
  } catch (error) {
    return handleApiError(error, "POST /api/subcategories");
  }
}
