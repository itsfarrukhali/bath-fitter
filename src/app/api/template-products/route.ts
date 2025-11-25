import { NextRequest } from "next/server";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  createPaginatedResponse,
  createSuccessResponse,
  parsePaginationParams,
} from "@/lib/api-response";
import { handleApiError, NotFoundError, ConflictError } from "@/lib/error-handler";
import { templateProductCreateSchema } from "@/schemas/api-schemas";
import { validateData, sanitizeSearchQuery } from "@/lib/validation";

/**
 * GET /api/template-products
 * Fetch template products with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePaginationParams(searchParams);
    const templateCategoryId = searchParams.get("templateCategoryId");
    const templateSubcategoryId = searchParams.get("templateSubcategoryId");
    const search = sanitizeSearchQuery(searchParams.get("search"));

    // Build where clause
    const whereClause: Prisma.TemplateProductWhereInput = {};

    if (templateCategoryId) {
      whereClause.templateCategoryId = parseInt(templateCategoryId);
    }

    if (templateSubcategoryId) {
      whereClause.templateSubcategoryId = parseInt(templateSubcategoryId);
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch template products
    const [templateProducts, total] = await Promise.all([
      prisma.templateProduct.findMany({
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
          templateSubcategory: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          templateVariants: {
            orderBy: { colorName: "asc" },
          },
          _count: {
            select: {
              templateVariants: true,
              products: true,
            },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.templateProduct.count({ where: whereClause }),
    ]);

    return createPaginatedResponse(
      templateProducts,
      { page, limit, total },
      search ? `Found ${total} template product(s)` : undefined
    );
  } catch (error) {
    return handleApiError(error, "GET /api/template-products");
  }
}

/**
 * POST /api/template-products
 * Create a new template product
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
    const validation = validateData(templateProductCreateSchema, body);

    if (!validation.success) {
      throw validation.errors;
    }

    const {
      name,
      slug,
      description,
      thumbnailUrl,
      templateCategoryId,
      templateSubcategoryId,
    } = validation.data;

    // Validate template category if provided
    if (templateCategoryId) {
      const templateCategory = await prisma.templateCategory.findUnique({
        where: { id: templateCategoryId },
      });
      if (!templateCategory) {
        throw new NotFoundError("Template category");
      }
    }

    // Validate template subcategory if provided
    if (templateSubcategoryId) {
      const templateSubcategory = await prisma.templateSubcategory.findUnique({
        where: { id: templateSubcategoryId },
      });
      if (!templateSubcategory) {
        throw new NotFoundError("Template subcategory");
      }
    }

    // Check for duplicate slug
    const existingProduct = await prisma.templateProduct.findFirst({
      where: {
        slug,
        OR: [
          { templateCategoryId: templateCategoryId || null },
          { templateSubcategoryId: templateSubcategoryId || null },
        ],
      },
    });

    if (existingProduct) {
      throw new ConflictError("Template product with this slug already exists");
    }

    // Create template product
    const templateProduct = await prisma.templateProduct.create({
      data: {
        name,
        slug,
        description: description || null,
        thumbnailUrl: thumbnailUrl || null,
        templateCategoryId: templateCategoryId || null,
        templateSubcategoryId: templateSubcategoryId || null,
      },
      include: {
        templateCategory: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        templateSubcategory: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            templateVariants: true,
            products: true,
          },
        },
      },
    });

    return createSuccessResponse(
      templateProduct,
      "Template product created successfully",
      201
    );
  } catch (error) {
    return handleApiError(error, "POST /api/template-products");
  }
}
