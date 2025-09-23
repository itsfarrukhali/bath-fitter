// src/app/api/template-variants/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { deleteFromCloudinary } from "@/lib/cloudinary";

type Params = { id: string };

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = params;

    const templateVariant = await prisma.templateVariant.findUnique({
      where: { id: parseInt(id) },
      include: {
        templateProduct: {
          include: {
            templateCategory: { select: { id: true, name: true, slug: true } },
            templateSubcategory: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    });

    if (!templateVariant) {
      return NextResponse.json(
        { success: false, message: "Template variant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: templateVariant });
  } catch (error) {
    console.error("Error fetching template variant:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch template variant" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createUnauthorizedResponse();
    }

    const { id } = params;
    const body = await request.json();
    const { colorName, colorCode, imageUrl, publicId } = body;

    // Check if template variant exists
    const existingVariant = await prisma.templateVariant.findUnique({
      where: { id: parseInt(id) },
      include: {
        templateProduct: true,
      },
    });

    if (!existingVariant) {
      return NextResponse.json(
        { success: false, message: "Template variant not found" },
        { status: 404 }
      );
    }

    // Basic validation
    if (!colorName?.trim()) {
      return NextResponse.json(
        { success: false, message: "Color name is required" },
        { status: 400 }
      );
    }

    // Check for duplicate color name
    if (colorName.trim() !== existingVariant.colorName) {
      const duplicateVariant = await prisma.templateVariant.findFirst({
        where: {
          colorName: colorName.trim(),
          templateProductId: existingVariant.templateProductId,
          id: { not: parseInt(id) },
        },
      });

      if (duplicateVariant) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Variant with this color name already exists in this product",
          },
          { status: 409 }
        );
      }
    }

    // Delete old image from Cloudinary if image is being updated
    if (
      imageUrl &&
      imageUrl !== existingVariant.imageUrl &&
      existingVariant.publicId
    ) {
      try {
        await deleteFromCloudinary(existingVariant.publicId);
      } catch (error) {
        console.error(
          `Failed to delete old image ${existingVariant.publicId}:`,
          error
        );
      }
    }

    const updatedVariant = await prisma.templateVariant.update({
      where: { id: parseInt(id) },
      data: {
        colorName: colorName.trim(),
        colorCode: colorCode?.trim() || null,
        imageUrl: imageUrl || existingVariant.imageUrl,
        publicId: publicId || existingVariant.publicId,
      },
      include: {
        templateProduct: {
          include: {
            templateCategory: { select: { id: true, name: true, slug: true } },
            templateSubcategory: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedVariant,
      message: "Template variant updated successfully",
    });
  } catch (error) {
    console.error("Error updating template variant:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update template variant" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return createUnauthorizedResponse();
    }

    const { id } = params;

    // Check if template variant exists
    const existingVariant = await prisma.templateVariant.findUnique({
      where: { id: parseInt(id) },
      include: {
        templateProduct: {
          include: {
            templateCategory: true,
            templateSubcategory: true,
          },
        },
      },
    });

    if (!existingVariant) {
      return NextResponse.json(
        { success: false, message: "Template variant not found" },
        { status: 404 }
      );
    }

    // Delete image from Cloudinary if exists
    if (existingVariant.publicId) {
      try {
        await deleteFromCloudinary(existingVariant.publicId);
      } catch (error) {
        console.error(
          `Failed to delete image ${existingVariant.publicId}:`,
          error
        );
      }
    }

    await prisma.templateVariant.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      success: true,
      message: "Template variant deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting template variant:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete template variant" },
      { status: 500 }
    );
  }
}
