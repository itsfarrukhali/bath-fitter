"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import axios, { AxiosError } from "axios";
import {
  FolderTree,
  Package,
  Palette,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Link from "next/link";

// Import modals
import CreateTemplateSubcategoryModal from "@/components/admin/templates/subcategory/create-template-subcategory-modal";
import EditTemplateSubcategoryModal from "@/components/admin/templates/subcategory/edit-template-subcategory-modal";
import DeleteTemplateSubcategoryModal from "@/components/admin/templates/subcategory/delete-template-subcategory-modal";
import CreateTemplateProductModal from "@/components/admin/templates/products/create-template-product-modal";
import EditTemplateProductModal from "@/components/admin/templates/products/edit-template-product-modal";
import DeleteTemplateProductModal from "@/components/admin/templates/products/delete-template-product-modal";
import CreateTemplateVariantModal from "@/components/admin/templates/variants/create-template-variant-modal";
import EditTemplateVariantModal from "@/components/admin/templates/variants/edit-template-variant-modal";
import DeleteTemplateVariantModal from "@/components/admin/templates/variants/delete-template-variant-modal";

// Import types from your type definitions
import {
  TemplateCategory,
  TemplateSubcategory,
  TemplateProduct,
  TemplateVariant,
} from "@/types/template";

export default function TemplateDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [template, setTemplate] = useState<TemplateCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSubcategories, setExpandedSubcategories] = useState<number[]>(
    []
  );
  const [expandedProducts, setExpandedProducts] = useState<number[]>([]);

  const toggleSubcategory = (subcategoryId: number) => {
    setExpandedSubcategories((prev) =>
      prev.includes(subcategoryId)
        ? prev.filter((id) => id !== subcategoryId)
        : [...prev, subcategoryId]
    );
  };

  const toggleProduct = (productId: number) => {
    setExpandedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const fetchTemplate = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);
    try {
      console.log("Fetching template with ID:", id);
      const { data } = await axios.get(`/api/template-categories/${id}`);
      console.log("API Response:", data);

      if (data.success) {
        setTemplate(data.data);
      } else {
        setError(data.message || "Failed to fetch template");
        toast.error(data.message || "Failed to fetch template");
      }
    } catch (err: unknown) {
      console.error("API Error:", err);
      if (err instanceof AxiosError) {
        const errorMessage =
          err.response?.data?.message || "Failed to fetch template";
        setError(errorMessage);
        toast.error(errorMessage);
      } else {
        const errorMessage = "An unexpected error occurred";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTemplate();
    }
  }, [id]);

  // Calculate total counts for better stats
  const getTotalStats = () => {
    if (!template) return { totalProducts: 0, totalVariants: 0 };

    const directProducts = template.templateProducts.length;
    const subcategoryProducts = template.templateSubcategories.reduce(
      (total, sub) => total + sub.templateProducts.length,
      0
    );

    const totalProducts = directProducts + subcategoryProducts;

    const totalVariants =
      template.templateProducts.reduce(
        (total, product) => total + product.templateVariants.length,
        0
      ) +
      template.templateSubcategories.reduce(
        (total, sub) =>
          total +
          sub.templateProducts.reduce(
            (subTotal, product) => subTotal + product.templateVariants.length,
            0
          ),
        0
      );

    return { totalProducts, totalVariants };
  };

  const { totalProducts, totalVariants } = getTotalStats();

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <Separator />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive mb-4">{error || "Template not found"}</p>
        <Button asChild>
          <Link href="/admin/templates">Back to Templates</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-1 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/templates">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {template.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {template.description}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <CreateTemplateSubcategoryModal
            templateCategoryId={template.id}
            onSubcategoryCreated={fetchTemplate}
          />
        </div>
      </div>

      <Separator />

      {/* Improved Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <FolderTree className="h-8 w-8 mx-auto text-blue-500" />
            <div className="text-2xl font-bold mt-2">
              {template.templateSubcategories.length}
            </div>
            <div className="text-sm text-muted-foreground">Subcategories</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-8 w-8 mx-auto text-green-500" />
            <div className="text-2xl font-bold mt-2">
              {template.templateProducts.length}
            </div>
            <div className="text-sm text-muted-foreground">Direct Products</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-8 w-8 mx-auto text-orange-500" />
            <div className="text-2xl font-bold mt-2">{totalProducts}</div>
            <div className="text-sm text-muted-foreground">Total Products</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Palette className="h-8 w-8 mx-auto text-purple-500" />
            <div className="text-2xl font-bold mt-2">{totalVariants}</div>
            <div className="text-sm text-muted-foreground">Total Variants</div>
          </CardContent>
        </Card>
      </div>

      {/* Template Subcategories Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Subcategories</h2>
        </div>

        {template.templateSubcategories.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <FolderTree className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No subcategories yet</p>
              <CreateTemplateSubcategoryModal
                templateCategoryId={template.id}
                onSubcategoryCreated={fetchTemplate}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {template.templateSubcategories.map((subcategory) => (
              <Card key={subcategory.id}>
                <CardHeader
                  className="pb-3 cursor-pointer"
                  onClick={() => toggleSubcategory(subcategory.id)}
                >
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center gap-3">
                      {expandedSubcategories.includes(subcategory.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <FolderTree className="h-4 w-4" />
                      {subcategory.name}
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">
                        {subcategory.templateProducts.length} products
                      </Badge>
                      <div
                        className="flex gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <EditTemplateSubcategoryModal
                          template={subcategory}
                          onSubcategoryUpdated={fetchTemplate}
                        />
                        <DeleteTemplateSubcategoryModal
                          templateSubcategory={subcategory}
                          onSubcategoryDeleted={fetchTemplate}
                        />
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>

                {expandedSubcategories.includes(subcategory.id) && (
                  <CardContent>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">Products</h4>
                      <CreateTemplateProductModal
                        templateCategoryId={template.id}
                        templateSubcategories={[subcategory]}
                        onProductCreated={fetchTemplate}
                      />
                    </div>

                    {subcategory.templateProducts.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No products in this subcategory
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {subcategory.templateProducts.map((product) => (
                          <div key={product.id} className="border rounded-lg">
                            <div
                              className="flex items-center justify-between p-3 bg-muted/50 rounded cursor-pointer"
                              onClick={() => toggleProduct(product.id)}
                            >
                              <div className="flex items-center gap-3">
                                {expandedProducts.includes(product.id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                                <Package className="h-4 w-4" />
                                <div>
                                  <div className="font-medium">
                                    {product.name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {product.templateVariants.length} variants
                                  </div>
                                </div>
                              </div>
                              <div
                                className="flex items-center gap-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Badge variant="outline">
                                  {product.templateVariants.length} variants
                                </Badge>
                                <div className="flex gap-1">
                                  <EditTemplateProductModal
                                    templateProduct={product}
                                    onProductUpdated={fetchTemplate}
                                  />
                                  <DeleteTemplateProductModal
                                    templateProduct={product}
                                    onProductDeleted={fetchTemplate}
                                  />
                                </div>
                              </div>
                            </div>

                            {expandedProducts.includes(product.id) && (
                              <div className="p-3 border-t">
                                <div className="flex justify-between items-center mb-3">
                                  <h5 className="font-medium text-sm">
                                    Variants
                                  </h5>
                                  <CreateTemplateVariantModal
                                    templateProductId={product.id}
                                    onVariantCreated={fetchTemplate}
                                  />
                                </div>

                                {product.templateVariants.length === 0 ? (
                                  <p className="text-sm text-muted-foreground text-center py-2">
                                    No variants yet
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    {product.templateVariants.map((variant) => (
                                      <div
                                        key={variant.id}
                                        className="flex items-center justify-between p-2 bg-muted/30 rounded"
                                      >
                                        <span className="flex items-center gap-2">
                                          {variant.colorCode && (
                                            <div
                                              className="w-4 h-4 rounded border"
                                              style={{
                                                backgroundColor:
                                                  variant.colorCode,
                                              }}
                                            />
                                          )}
                                          {variant.colorName}
                                        </span>
                                        <div className="flex gap-1">
                                          <EditTemplateVariantModal
                                            templateVariant={variant}
                                            onVariantUpdated={fetchTemplate}
                                          />
                                          <DeleteTemplateVariantModal
                                            templateVariant={variant}
                                            onVariantDeleted={fetchTemplate}
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Direct Template Products Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Direct Products</h2>
          <CreateTemplateProductModal
            templateCategoryId={template.id}
            templateSubcategories={template.templateSubcategories}
            onProductCreated={fetchTemplate}
          />
        </div>

        {template.templateProducts.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No direct products yet
              </p>
              <CreateTemplateProductModal
                templateCategoryId={template.id}
                templateSubcategories={template.templateSubcategories}
                onProductCreated={fetchTemplate}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {template.templateProducts.map((product) => (
              <Card key={product.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      {product.name}
                    </span>
                    <Badge>{product.templateVariants.length} variants</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-1">
                      <EditTemplateProductModal
                        templateProduct={product}
                        onProductUpdated={fetchTemplate}
                      />
                      <DeleteTemplateProductModal
                        templateProduct={product}
                        onProductDeleted={fetchTemplate}
                      />
                    </div>
                    <CreateTemplateVariantModal
                      templateProductId={product.id}
                      onVariantCreated={fetchTemplate}
                    />
                  </div>

                  {product.templateVariants.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No variants yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {product.templateVariants.map((variant) => (
                        <div
                          key={variant.id}
                          className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded"
                        >
                          <span className="flex items-center gap-2">
                            {variant.colorCode && (
                              <div
                                className="w-4 h-4 rounded border"
                                style={{ backgroundColor: variant.colorCode }}
                              />
                            )}
                            {variant.colorName}
                          </span>
                          <div className="flex gap-1">
                            <EditTemplateVariantModal
                              templateVariant={variant}
                              onVariantUpdated={fetchTemplate}
                            />
                            <DeleteTemplateVariantModal
                              templateVariant={variant}
                              onVariantDeleted={fetchTemplate}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
