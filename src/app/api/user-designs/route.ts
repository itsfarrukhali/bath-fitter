import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  createPaginatedResponse,
  createSuccessResponse,
  parsePaginationParams,
  createErrorResponse,
} from "@/lib/api-response";
import { handleApiError, NotFoundError } from "@/lib/error-handler";
import { userDesignCreateSchema } from "@/schemas/api-schemas";
import { validateData, sanitizeSearchQuery } from "@/lib/validation";
import { Prisma } from "@prisma/client";
import { getAuthenticatedUser } from "@/lib/auth";

/**
 * GET /api/user-designs
 * Fetch user designs
 * 
 * Public endpoint when email is provided (for loading user's own designs)
 * Admin endpoint when no email is provided (for viewing all designs)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePaginationParams(searchParams);
    const showerTypeId = searchParams.get("showerTypeId");
    const email = sanitizeSearchQuery(searchParams.get("email"));
    const search = sanitizeSearchQuery(searchParams.get("search"));

    // Build where clause
    const whereClause: Prisma.UserDesignWhereInput = {};

    // If email is provided, it's a public request to load user's designs
    if (email) {
      whereClause.userEmail = {
        equals: email,
        mode: "insensitive",
      };
    } else {
      // If no email, require admin authentication
      const authUser = await getAuthenticatedUser(request);
      if (!authUser) {
        return createErrorResponse(
          "Email parameter required or admin authentication needed",
          401
        );
      }
    }

    if (showerTypeId) {
      whereClause.showerTypeId = parseInt(showerTypeId);
    }

    if (search && !email) {
      // Search only for admin queries
      whereClause.OR = [
        { userFullName: { contains: search, mode: "insensitive" } },
        { userEmail: { contains: search, mode: "insensitive" } },
        { userPhone: { contains: search, mode: "insensitive" } },
        { userPostalCode: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch user designs with relations
    const [userDesigns, total] = await Promise.all([
      prisma.userDesign.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          showerType: {
            select: {
              id: true,
              name: true,
              slug: true,
              baseImage: true,
              projectType: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.userDesign.count({ where: whereClause }),
    ]);

    return createPaginatedResponse(
      userDesigns,
      { page, limit, total },
      email
        ? `Found ${total} design(s) for this email`
        : search
        ? `Found ${total} user design(s)`
        : undefined
    );
  } catch (error) {
    return handleApiError(error, "GET /api/user-designs");
  }
}

/**
 * POST /api/user-designs
 * Save a new user design
 * Public endpoint - no authentication required
 * 
 * Flow:
 * 1. User creates design
 * 2. User clicks "Save Design"
 * 3. User enters email (and optionally name, phone, postal code)
 * 4. Design is saved with user info
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = validateData(userDesignCreateSchema, body);

    if (!validation.success) {
      throw validation.errors;
    }

    const {
      userFullName,
      userEmail,
      userPhone,
      userPostalCode,
      designData,
      showerTypeId,
    } = validation.data;

    // Email is required for saving designs
    if (!userEmail) {
      return createErrorResponse(
        "Email address is required to save your design",
        400
      );
    }

    // Validate shower type exists
    const showerType = await prisma.showerType.findUnique({
      where: { id: showerTypeId },
    });

    if (!showerType) {
      throw new NotFoundError("Shower type");
    }

    // Create user design
    const userDesign = await prisma.userDesign.create({
      data: {
        userFullName: userFullName || null,
        userEmail: userEmail,
        userPhone: userPhone || null,
        userPostalCode: userPostalCode || null,
        designData: designData as Prisma.InputJsonValue,
        showerTypeId,
      },
      include: {
        showerType: {
          select: {
            id: true,
            name: true,
            slug: true,
            baseImage: true,
            projectType: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    return createSuccessResponse(
      userDesign,
      "Design saved successfully! You can load it anytime using your email address.",
      201
    );
  } catch (error) {
    return handleApiError(error, "POST /api/user-designs");
  }
}
