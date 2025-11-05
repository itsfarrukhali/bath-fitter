// app/api/variants/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PlumbingConfig } from "@prisma/client";

interface VariantCreateData {
  colorName: string;
  colorCode?: string;
  imageUrl: string;
  publicId?: string;
  productId: number;
  plumbing_config?: PlumbingConfig | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { success: false, message: "productId is required" },
        { status: 400 }
      );
    }

    const variants = await prisma.productVariant.findMany({
      where: { productId: parseInt(productId) },
      orderBy: { colorName: "asc" },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            category: {
              select: { id: true, name: true, showerTypeId: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: variants,
    });
  } catch (error) {
    console.error("Error fetching variants:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch variants" },
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

    const body: VariantCreateData = await request.json();
    const {
      colorName,
      colorCode,
      imageUrl,
      publicId,
      productId,
      plumbing_config,
    } = body;

    if (!colorName?.trim() || !imageUrl?.trim() || !productId) {
      return NextResponse.json(
        {
          success: false,
          message: "Color name, image URL, and product ID are required",
        },
        { status: 400 }
      );
    }

    // Validate plumbing_config if provided
    if (
      plumbing_config &&
      !Object.values(PlumbingConfig).includes(plumbing_config)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid plumbing configuration",
        },
        { status: 400 }
      );
    }

    // Validate product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    // Check for duplicate color name in same product
    const existingVariant = await prisma.productVariant.findFirst({
      where: {
        colorName: colorName.trim(),
        productId,
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

    const variant = await prisma.productVariant.create({
      data: {
        colorName: colorName.trim(),
        colorCode: colorCode?.trim() || null,
        imageUrl: imageUrl.trim(),
        publicId: publicId || null,
        productId,
        plumbing_config: plumbing_config || null,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            category: {
              select: { id: true, name: true, showerType: true },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: variant,
        message: "Product variant created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating variant:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create variant" },
      { status: 500 }
    );
  }
}
