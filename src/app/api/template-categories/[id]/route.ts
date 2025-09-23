// app/api/template-categories/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createUnauthorizedResponse, getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { TemplateCreateData } from "@/types/template";

type Params = Promise<{ id: string }>;

// GET - Fetch a specific template category by ID
export async function GET(
  _request: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const params = await segmentData.params;
    const { id } = params;

    const template = await prisma.templateCategory.findUnique({
      where: { id: parseInt(id) },
      include: {
        templateSubcategories: {
          include: {
            templateProducts: {
              include: {
                templateVariants: {
                  include: {
                    templateProduct: {
                      select: { id: true, name: true, slug: true },
                    },
                  },
                },
              },
            },
            _count: {
              select: { templateProducts: true, subcategories: true },
            },
          },
        },
        templateProducts: {
          include: {
            templateVariants: {
              include: {
                templateProduct: {
                  select: { id: true, name: true, slug: true },
                },
              },
            },
          },
        },
        categories: {
          include: {
            showerType: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        _count: {
          select: {
            templateSubcategories: true,
            templateProducts: true,
            categories: true,
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json(
        { success: false, message: "Template category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error("Error fetching template category:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch template category" },
      { status: 500 }
    );
  }
}

// PUT - Update a template category
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
    const body: TemplateCreateData = await request.json();
    const { name, slug, description } = body;

    // Check if template exists
    const existingTemplate = await prisma.templateCategory.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { success: false, message: "Template category not found" },
        { status: 404 }
      );
    }

    // Check if slug is being changed and if it's already taken
    if (slug && slug !== existingTemplate.slug) {
      const duplicate = await prisma.templateCategory.findFirst({
        where: {
          slug,
          id: { not: parseInt(id) },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { success: false, message: "Template with this slug already exists" },
          { status: 409 }
        );
      }
    }

    const updatedTemplate = await prisma.templateCategory.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description !== undefined && { description }),
      },
      include: {
        _count: {
          select: {
            templateSubcategories: true,
            templateProducts: true,
            categories: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedTemplate,
      message: "Template category updated successfully",
    });
  } catch (error) {
    console.error("Error updating template category:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update template category" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a template category
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

    const existingTemplate = await prisma.templateCategory.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            templateSubcategories: true,
            templateProducts: true,
            categories: true,
          },
        },
      },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { success: false, message: "Template category not found" },
        { status: 404 }
      );
    }

    // Prevent deletion if template has instances or sub-templates
    if (
      existingTemplate._count.categories > 0 ||
      existingTemplate._count.templateSubcategories > 0 ||
      existingTemplate._count.templateProducts > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot delete template that has instances, subcategories, or products. Please remove them first.",
        },
        { status: 400 }
      );
    }

    await prisma.templateCategory.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      success: true,
      message: "Template category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting template category:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete template category" },
      { status: 500 }
    );
  }
}
