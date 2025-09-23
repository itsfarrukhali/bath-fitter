import { NextRequest, NextResponse } from "next/server";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateProductId = searchParams.get("templateProductId");

    if (!templateProductId) {
      return NextResponse.json(
        { success: false, message: "templateProductId is required" },
        { status: 400 }
      );
    }

    const templateVariants = await prisma.templateVariant.findMany({
      where: { templateProductId: parseInt(templateProductId) },
      orderBy: { colorName: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: templateVariants,
    });
  } catch (error) {
    console.error("Error fetching template variants:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch template variants" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createUnauthorizedResponse();
    }

    const body = await request.json();
    const { colorName, colorCode, imageUrl, publicId, templateProductId } =
      body;

    if (!colorName || !imageUrl || !templateProductId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Color name, image URL, and template product ID are required",
        },
        { status: 400 }
      );
    }

    // Check if template product exists
    const templateProduct = await prisma.templateProduct.findUnique({
      where: { id: templateProductId },
    });

    if (!templateProduct) {
      return NextResponse.json(
        { success: false, message: "Template product not found" },
        { status: 404 }
      );
    }

    // Check for duplicate color name
    const existingVariant = await prisma.templateVariant.findFirst({
      where: {
        colorName: colorName.trim(),
        templateProductId: templateProductId,
      },
    });

    if (existingVariant) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Variant with this color name already exists in this product",
        },
        { status: 409 }
      );
    }

    const templateVariant = await prisma.templateVariant.create({
      data: {
        colorName: colorName.trim(),
        colorCode: colorCode?.trim() || null,
        imageUrl: imageUrl.trim(),
        publicId: publicId || null,
        templateProductId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: templateVariant,
        message: "Template variant created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating template variant:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create template variant" },
      { status: 500 }
    );
  }
}
