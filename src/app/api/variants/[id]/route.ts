// app/api/variants/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import { PlumbingConfig } from "@prisma/client";

type Params = Promise<{ id: string }>;

export async function GET(
  request: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const params = await segmentData.params;
    const { id } = params;

    const variant = await prisma.productVariant.findUnique({
      where: { id: parseInt(id) },
      include: {
        product: {
          include: {
            category: {
              select: { id: true, name: true, showerType: true },
            },
            subcategory: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!variant) {
      return NextResponse.json(
        { success: false, message: "Variant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: variant });
  } catch (error) {
    console.error("Error fetching variant:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch variant" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createUnauthorizedResponse();
    }

    const params = await segmentData.params;
    const { id } = params;
    const body = await request.json();
    const { colorName, colorCode, imageUrl, publicId, plumbing_config } = body;

    const existingVariant = await prisma.productVariant.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingVariant) {
      return NextResponse.json(
        { success: false, message: "Variant not found" },
        { status: 404 }
      );
    }

    if (!colorName?.trim()) {
      return NextResponse.json(
        { success: false, message: "Color name is required" },
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

    // Check for duplicate color name
    if (colorName.trim() !== existingVariant.colorName) {
      const duplicateVariant = await prisma.productVariant.findFirst({
        where: {
          colorName: colorName.trim(),
          productId: existingVariant.productId,
          id: { not: parseInt(id) },
        },
      });

      if (duplicateVariant) {
        return NextResponse.json(
          {
            success: false,
            message: "Variant with this color name already exists",
          },
          { status: 409 }
        );
      }
    }

    // Delete old image if changed
    if (
      imageUrl &&
      imageUrl !== existingVariant.imageUrl &&
      existingVariant.publicId
    ) {
      try {
        await deleteFromCloudinary(existingVariant.publicId);
      } catch (error) {
        console.error("Failed to delete old image:", error);
      }
    }

    const updatedVariant = await prisma.productVariant.update({
      where: { id: parseInt(id) },
      data: {
        colorName: colorName.trim(),
        colorCode: colorCode?.trim() || null,
        imageUrl: imageUrl || existingVariant.imageUrl,
        publicId: publicId || existingVariant.publicId,
        plumbing_config:
          plumbing_config !== undefined
            ? plumbing_config
            : existingVariant.plumbing_config,
      },
      include: {
        product: {
          include: {
            category: {
              select: { id: true, name: true, showerType: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedVariant,
      message: "Variant updated successfully",
    });
  } catch (error) {
    console.error("Error updating variant:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update variant" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createUnauthorizedResponse();
    }

    const params = await segmentData.params;
    const { id } = params;

    const variant = await prisma.productVariant.findUnique({
      where: { id: parseInt(id) },
    });

    if (!variant) {
      return NextResponse.json(
        { success: false, message: "Variant not found" },
        { status: 404 }
      );
    }

    // Delete image from Cloudinary
    if (variant.publicId) {
      try {
        await deleteFromCloudinary(variant.publicId);
      } catch (error) {
        console.error("Failed to delete image:", error);
      }
    }

    await prisma.productVariant.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      success: true,
      message: "Variant deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting variant:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete variant" },
      { status: 500 }
    );
  }
}
