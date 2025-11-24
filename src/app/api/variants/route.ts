import { NextRequest, NextResponse } from "next/server";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PlumbingConfig } from "@prisma/client";
import {
  createSuccessResponse,
  parsePaginationParams,
  createPaginatedResponse,
} from "@/lib/api-response";
import { handleApiError, NotFoundError, ConflictError } from "@/lib/error-handler";
import { productVariantCreateSchema } from "@/schemas/api-schemas";
import { validateData } from "@/lib/validation";

/**
 * GET /api/variants
 * Fetch product variants with optional filtering
 * Requires productId parameter
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const { page, limit, skip } = parsePaginationParams(searchParams);

    if (!productId) {
      throw new Error("productId is required");
    }

    // Fetch variants with pagination
    const [variants, total] = await Promise.all([
      prisma.productVariant.findMany({
        where: { productId: parseInt(productId) },
        skip,
        take: limit,
        orderBy: { colorName: "asc" },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              category: {
                select: { 
                  id: true, 
                  name: true, 
                  showerTypeId: true,
                  showerType: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
          templateVariant: {
            select: {
              id: true,
              colorName: true,
              colorCode: true,
            },
          },
        },
      }),
      prisma.productVariant.count({ where: { productId: parseInt(productId) } }),
    ]);

    return createPaginatedResponse(
      variants,
      { page, limit, total }
    );
  } catch (error) {
    return handleApiError(error, "GET /api/variants");
  }
}

/**
 * POST /api/variants
 * Create a new product variant
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
    const validation = validateData(productVariantCreateSchema, body);

    if (!validation.success) {
      throw validation.errors;
    }

    const {
      colorName,
      colorCode,
      imageUrl,
      publicId,
      productId,
      plumbing_config,
      templateVariantId,
    } = validation.data;

    // Validate plumbing_config if provided
    if (
      plumbing_config &&
      !Object.values(PlumbingConfig).includes(plumbing_config)
    ) {
      throw new Error("Invalid plumbing configuration");
    }

    // Validate product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true },
    });

    if (!product) {
      throw new NotFoundError("Product");
    }

    // Validate template variant if provided
    if (templateVariantId) {
      const templateVariant = await prisma.templateVariant.findUnique({
        where: { id: templateVariantId },
      });
      if (!templateVariant) {
        throw new NotFoundError("Template variant");
      }
    }

    // Check for duplicate color name in same product
    const existingVariant = await prisma.productVariant.findFirst({
      where: {
        colorName: colorName.trim(),
        productId,
      },
    });

    if (existingVariant) {
      throw new ConflictError(
        "Variant with this color name already exists in this product"
      );
    }

    // Create variant
    const variant = await prisma.productVariant.create({
      data: {
        colorName: colorName.trim(),
        colorCode: colorCode?.trim() || null,
        imageUrl: imageUrl.trim(),
        publicId: publicId || null,
        productId,
        plumbing_config: plumbing_config || null,
        templateVariantId: templateVariantId || null,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: {
              select: { 
                id: true, 
                name: true, 
                showerType: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
        templateVariant: {
          select: {
            id: true,
            colorName: true,
            colorCode: true,
          },
        },
      },
    });

    return createSuccessResponse(
      variant,
      "Product variant created successfully",
      201
    );
  } catch (error) {
    return handleApiError(error, "POST /api/variants");
  }
}
