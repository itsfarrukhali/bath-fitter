import { NextRequest, NextResponse } from "next/server";
import { PlumbingConfig, Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser, createUnauthorizedResponse } from "@/lib/auth";
import {
  createPaginatedResponse,
  createSuccessResponse,
  parsePaginationParams,
} from "@/lib/api-response";
import { handleApiError, NotFoundError, ConflictError } from "@/lib/error-handler";
import { categoryCreateSchema } from "@/schemas/api-schemas";
import { validateData, sanitizeSearchQuery } from "@/lib/validation";

/**
 * GET /api/categories
 * Fetch categories with optional filtering
 * Supports both admin and customer-facing modes
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const showerTypeId = searchParams.get("showerTypeId");
    const includeProducts = searchParams.get("includeProducts") === "true";
    const forAdmin = searchParams.get("forAdmin") === "true";
    const plumbingConfig = searchParams.get("plumbingConfig");
    const search = sanitizeSearchQuery(searchParams.get("search"));

    // Validate and normalize plumbing config
    const normalizedPlumbingConfig = plumbingConfig
      ? (plumbingConfig.toUpperCase() as PlumbingConfig)
      : undefined;
    const isValidPlumbingConfig = normalizedPlumbingConfig
      ? Object.values(PlumbingConfig).includes(normalizedPlumbingConfig)
      : undefined;

    // Build plumbing variant filter
    const plumbingVariantFilter: Prisma.ProductVariantWhereInput | undefined =
      isValidPlumbingConfig
        ? {
            OR: [
              { plumbing_config: normalizedPlumbingConfig },
              { plumbing_config: PlumbingConfig.BOTH },
              { plumbing_config: null },
            ],
          }
        : {
            OR: [
              { plumbing_config: PlumbingConfig.BOTH },
              { plumbing_config: PlumbingConfig.LEFT },
              { plumbing_config: PlumbingConfig.RIGHT },
              { plumbing_config: null },
            ],
          };

    // Admin mode - return all categories with pagination
    if (forAdmin) {
      const { page, limit, skip } = parsePaginationParams(searchParams);

      // Build where clause for admin
      const whereClause: Prisma.CategoryWhereInput = {};
      
      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { slug: { contains: search, mode: "insensitive" } },
        ];
      }

      if (showerTypeId) {
        whereClause.showerTypeId = parseInt(showerTypeId);
      }

      const [categories, total] = await Promise.all([
        prisma.category.findMany({
          where: whereClause,
          skip,
          take: limit,
          include: {
            showerType: {
              select: { id: true, name: true, slug: true },
            },
            subcategories: {
              include: {
                _count: {
                  select: { products: true },
                },
              },
              orderBy: { z_index: "asc" },
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
              select: {
                products: true,
                subcategories: true,
              },
            },
          },
          orderBy: [{ z_index: "asc" }, { name: "asc" }],
        }),
        prisma.category.count({ where: whereClause }),
      ]);

      return createPaginatedResponse(
        categories,
        { page, limit, total },
        search ? `Found ${total} category(ies)` : undefined
      );
    }

    // Customer-facing mode - requires showerTypeId
    if (!showerTypeId) {
      throw new Error("showerTypeId is required for customer-facing API");
    }

    // Build where clause for customer
    const whereClause: Prisma.CategoryWhereInput = {
      showerTypeId: parseInt(showerTypeId),
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    if (includeProducts) {
      whereClause.products = {
        some: {},
      };
    }

    const categories = await prisma.category.findMany({
      where: whereClause,
      include: {
        showerType: {
          select: { id: true, name: true, slug: true },
        },
        subcategories: includeProducts
          ? {
              include: {
                products: {
                  include: {
                    variants: {
                      where: plumbingVariantFilter,
                      orderBy: { colorName: "asc" },
                    },
                  },
                  where: {
                    variants: {
                      some: {},
                    },
                  },
                  orderBy: { z_index: "asc" },
                },
              },
              orderBy: { z_index: "asc" },
            }
          : {
              select: {
                id: true,
                name: true,
                slug: true,
                z_index: true,
                categoryId: true,
              },
              orderBy: { z_index: "asc" },
            },
        products: includeProducts
          ? {
              include: {
                variants: {
                  where: plumbingVariantFilter,
                  orderBy: { colorName: "asc" },
                },
              },
              where: {
                variants: {
                  some: {},
                },
              },
              orderBy: { z_index: "asc" },
            }
          : {
              select: {
                id: true,
                name: true,
                slug: true,
                z_index: true,
                categoryId: true,
              },
              orderBy: { z_index: "asc" },
            },
      },
      orderBy: [{ z_index: "asc" }, { name: "asc" }],
    });

    // Filter out categories with no products (if includeProducts is true)
    const filteredCategories = includeProducts
      ? categories.filter((category) => {
          const hasDirectProducts =
            category.products && category.products.length > 0;

          const hasSubcategoryProducts = category.subcategories?.some(
            (sub: { products?: unknown[] }) => sub.products && sub.products.length > 0
          );

          return hasDirectProducts || hasSubcategoryProducts;
        })
      : categories;

    return createSuccessResponse(filteredCategories);
  } catch (error) {
    return handleApiError(error, "GET /api/categories");
  }
}

/**
 * POST /api/categories
 * Create a new category
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
    const validation = validateData(categoryCreateSchema, body);

    if (!validation.success) {
      throw validation.errors;
    }

    const { name, slug, hasSubcategories, showerTypeId, templateId, z_index, plumbingConfig } =
      validation.data;

    // Validate z_index
    if (z_index !== undefined && z_index !== null) {
      if (z_index < 0 || z_index > 100) {
        throw new Error("Z-Index must be between 0 and 100");
      }
    }

    // If using template, verify it exists
    if (templateId) {
      const template = await prisma.templateCategory.findUnique({
        where: { id: templateId },
      });
      if (!template) {
        throw new NotFoundError("Template");
      }
    }

    // Check if shower type exists
    const showerType = await prisma.showerType.findUnique({
      where: { id: showerTypeId },
    });
    if (!showerType) {
      throw new NotFoundError("Shower type");
    }

    // Check for existing category with same slug in this shower type
    const existingCategory = await prisma.category.findFirst({
      where: { slug, showerTypeId },
    });
    if (existingCategory) {
      throw new ConflictError(
        "Category with this slug already exists in this shower type"
      );
    }

    // Create category
    const category = await prisma.category.create({
      data: {
        name,
        slug,
        hasSubcategories: hasSubcategories || false,
        showerTypeId,
        templateId: templateId || null,
        z_index: z_index ?? 50,
        plumbingConfig: plumbingConfig || PlumbingConfig.LEFT,
      },
      include: {
        showerType: { select: { id: true, name: true, slug: true } },
        template: { select: { id: true, name: true, slug: true } },
        _count: { select: { subcategories: true, products: true } },
      },
    });

    return createSuccessResponse(
      category,
      "Category created successfully",
      201
    );
  } catch (error) {
    return handleApiError(error, "POST /api/categories");
  }
}
