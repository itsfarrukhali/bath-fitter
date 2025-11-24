import { NextRequest, NextResponse } from "next/server";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PlumbingConfig, Prisma } from "@prisma/client";
import {
  createPaginatedResponse,
  createSuccessResponse,
  parsePaginationParams,
} from "@/lib/api-response";
import { handleApiError, NotFoundError, ConflictError } from "@/lib/error-handler";
import { templateVariantCreateSchema } from "@/schemas/api-schemas";
import { validateData } from "@/lib/validation";

/**
 * GET /api/template-variants
 * Fetch template variants with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePaginationParams(searchParams);
    const templateProductId = searchParams.get("templateProductId");

    // Build where clause
    const whereClause: Prisma.TemplateVariantWhereInput = {};

    if (templateProductId) {
      whereClause.templateProductId = parseInt(templateProductId);
    }

    // Fetch template variants
    const [templateVariants, total] = await Promise.all([
      prisma.templateVariant.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          templateProduct: {
            select: {
              id: true,
              name: true,
              slug: true,
              templateCategory: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          _count: {
            select: {
              ProductVariant: true,
            },
          },
        },
        orderBy: { colorName: "asc" },
      }),
      prisma.templateVariant.count({ where: whereClause }),
    ]);

    return createPaginatedResponse(
      templateVariants,
      { page, limit, total }
    );
  } catch (error) {
    return handleApiError(error, "GET /api/template-variants");
  }
}

/**
 * POST /api/template-variants
 * Create a new template variant
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
    const validation = validateData(templateVariantCreateSchema, body);

    if (!validation.success) {
      throw validation.errors;
    }

    const {
      colorName,
      colorCode,
      imageUrl,
      publicId,
      templateProductId,
      plumbingConfig,
    } = validation.data;

    // Validate plumbing config if provided
    if (
      plumbingConfig &&
      !Object.values(PlumbingConfig).includes(plumbingConfig)
    ) {
      throw new Error("Invalid plumbing configuration");
    }

    // Validate template product exists
    const templateProduct = await prisma.templateProduct.findUnique({
      where: { id: templateProductId },
    });

    if (!templateProduct) {
      throw new NotFoundError("Template product");
    }

    // Check for duplicate color name in same template product
    const existingVariant = await prisma.templateVariant.findFirst({
      where: {
        colorName: colorName.trim(),
        templateProductId,
      },
    });

    if (existingVariant) {
      throw new ConflictError(
        "Template variant with this color name already exists in this template product"
      );
    }

    // Create template variant
    const templateVariant = await prisma.templateVariant.create({
      data: {
        colorName: colorName.trim(),
        colorCode: colorCode?.trim() || null,
        imageUrl: imageUrl.trim(),
        publicId: publicId || null,
        templateProductId,
        plumbingConfig: plumbingConfig || PlumbingConfig.LEFT,
      },
      include: {
        templateProduct: {
          select: {
            id: true,
            name: true,
            slug: true,
            templateCategory: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            ProductVariant: true,
          },
        },
      },
    });

    return createSuccessResponse(
      templateVariant,
      "Template variant created successfully",
      201
    );
  } catch (error) {
    return handleApiError(error, "POST /api/template-variants");
  }
}
