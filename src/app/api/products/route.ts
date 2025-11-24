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
import { productCreateSchema } from "@/schemas/api-schemas";
import { validateData, sanitizeSearchQuery } from "@/lib/validation";

/**
 * GET /api/products
 * Fetch products with optional filtering and search
 * Supports filtering by category and subcategory
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePaginationParams(searchParams);
    const categoryId = searchParams.get("categoryId");
    const subcategoryId = searchParams.get("subcategoryId");
    const search = sanitizeSearchQuery(searchParams.get("search"));

    // Build where clause
    const whereClause: Prisma.ProductWhereInput = {};

    if (categoryId) {
      whereClause.categoryId = parseInt(categoryId);
    }

    if (subcategoryId) {
      whereClause.subcategoryId = parseInt(subcategoryId);
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch products with relations
    const [products, total] = await Promise.all([
      prisma.product.findMany({
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
          subcategory: {
            select: {
              id: true,
              name: true,
              slug: true,
              z_index: true,
            },
          },
          variants: {
            orderBy: { colorName: "asc" },
          },
          _count: {
            select: { variants: true },
          },
        },
        orderBy: [{ z_index: "asc" }, { name: "asc" }],
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    return createPaginatedResponse(
      products,
      { page, limit, total },
      search ? `Found ${total} product(s)` : undefined
    );
  } catch (error) {
    return handleApiError(error, "GET /api/products");
  }
}

/**
 * POST /api/products
 * Create a new product
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
    const validation = validateData(productCreateSchema, body);

    if (!validation.success) {
      throw validation.errors;
    }

    const {
      name,
      slug,
      description,
      thumbnailUrl,
      categoryId,
      subcategoryId,
      z_index,
      plumbingConfig,
    } = validation.data;

    // Validate z_index range if provided
    if (z_index !== undefined && z_index !== null) {
      if (z_index < 0 || z_index > 100) {
        throw new Error("Z-Index must be between 0 and 100");
      }
    }

    // Validate category exists and get its z_index
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { showerType: true },
    });

    if (!category) {
      throw new NotFoundError("Category");
    }

    // Validate subcategory if provided and get its z_index
    let subcategory = null;
    if (subcategoryId) {
      subcategory = await prisma.subcategory.findUnique({
        where: { id: subcategoryId, categoryId },
      });
      if (!subcategory) {
        throw new NotFoundError("Subcategory in this category");
      }
    }

    // Check for duplicate slug
    const existingProduct = await prisma.product.findFirst({
      where: {
        slug: slug.trim(),
        OR: [
          { categoryId, subcategoryId: null },
          { subcategoryId: subcategoryId || undefined },
        ],
      },
    });

    if (existingProduct) {
      throw new ConflictError("Product with this slug already exists");
    }

    // Determine default z_index: use provided value, otherwise inherit from parent
    let finalZIndex: number | null = null;
    if (z_index !== undefined && z_index !== null) {
      finalZIndex = z_index;
    } else if (subcategory && subcategory.z_index !== null) {
      finalZIndex = subcategory.z_index;
    } else if (category.z_index !== null) {
      finalZIndex = category.z_index;
    } else {
      finalZIndex = 50;
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        slug: slug.trim(),
        description: description?.trim() || null,
        thumbnailUrl: thumbnailUrl?.trim() || null,
        categoryId,
        subcategoryId: subcategoryId || null,
        z_index: finalZIndex,
        ...(plumbingConfig && { plumbingConfig }),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            showerType: true,
            z_index: true,
          },
        },
        subcategory: {
          select: {
            id: true,
            name: true,
            slug: true,
            z_index: true,
          },
        },
        variants: true,
        _count: { select: { variants: true } },
      },
    });

    return createSuccessResponse(
      product,
      "Product created successfully",
      201
    );
  } catch (error) {
    return handleApiError(error, "POST /api/products");
  }
}
