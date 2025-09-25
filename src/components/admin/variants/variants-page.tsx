// components/admin/variants/variants-page-content.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import { Plus, Edit, Trash2, ArrowLeft, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Product, ProductVariant } from "@/types/products";
import CreateVariantModal from "@/components/admin/variants/create-variant-modal";
import EditVariantModal from "@/components/admin/variants/edit-variant-modal";
import DeleteVariantModal from "@/components/admin/variants/delete-variant-modal";
import { Label } from "@/components/ui/label";
import Image from "next/image";

export default function VariantsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get("productId");

  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );

  const fetchData = useCallback(async () => {
    if (!productId) return;

    try {
      setLoading(true);
      setError(null);

      const [variantsResponse, productResponse] = await Promise.all([
        axios.get(`/api/variants?productId=${productId}`),
        axios.get(`/api/products/${productId}`),
      ]);

      if (variantsResponse.data.success) {
        setVariants(variantsResponse.data.data);
      }

      if (productResponse.data.success) {
        setProduct(productResponse.data.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      let errorMessage = "Failed to fetch data";

      if (error instanceof AxiosError) {
        errorMessage = error.response?.data?.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (productId) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [productId, fetchData]);

  const filteredVariants = variants.filter(
    (variant) =>
      variant.colorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      variant.colorCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setShowEditModal(true);
  };

  const handleDelete = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setShowDeleteModal(true);
  };

  const handleGoBack = () => {
    router.push("/admin/products");
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div className="p-4 border border-destructive/50 rounded-md bg-destructive/10">
          <p className="text-destructive">{error}</p>
          <div className="flex gap-2 justify-center mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              className="cursor-pointer"
            >
              Try Again
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGoBack}
              className="cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // No product ID
  if (!productId) {
    return (
      <div className="container mx-auto p-6 text-center">
        <p className="text-muted-foreground">
          Please select a product to view variants
        </p>
        <Button onClick={handleGoBack} className="mt-4 cursor-pointer">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={handleGoBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Variants Management</h1>
            <p className="text-muted-foreground">
              {product
                ? `Managing variants for: ${product.name}`
                : "Loading product..."}
            </p>
          </div>
        </div>
        <Button
          className="cursor-pointer"
          onClick={() => setShowCreateModal(true)}
          disabled={!product}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Variant
        </Button>
      </div>

      {/* Product Info */}
      {product && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Product
                </Label>
                <p className="font-medium">{product.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Category
                </Label>
                <p className="font-medium">
                  {product.category.showerType.name} → {product.category.name}
                  {product.subcategory && ` → ${product.subcategory.name}`}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Total Variants
                </Label>
                <p className="font-medium">{variants.length} variants</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Search Variants</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by color name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Variants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVariants.map((variant) => (
          <Card key={variant.id} className="overflow-hidden relative z-10">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{variant.colorName}</CardTitle>
                {variant.colorCode && (
                  <div
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: variant.colorCode }}
                    title={variant.colorCode}
                  />
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {variant.imageUrl ? (
                <div className="relative w-full h-48 overflow-hidden rounded-lg bg-gray-50">
                  <Image
                    src={variant.imageUrl}
                    alt={variant.colorName}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              ) : (
                <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400">No Image</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                {variant.colorCode && (
                  <Badge variant="outline">{variant.colorCode}</Badge>
                )}
                <div className="text-sm text-muted-foreground">
                  Created: {new Date(variant.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(variant)}
                  className="flex-1 cursor-pointer"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(variant)}
                  className="flex-1 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredVariants.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground">
              {variants.length === 0 ? (
                <>
                  <p className="text-lg font-medium">No variants found</p>
                  <p className="mt-2">
                    Get started by creating your first variant
                  </p>
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 cursor-pointer"
                    disabled={!product}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Variant
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium">No matching variants</p>
                  <p className="mt-2">Try adjusting your search term</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {product && (
        <CreateVariantModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          product={product}
          onVariantCreated={() => {
            fetchData();
            setShowCreateModal(false);
          }}
        />
      )}

      {selectedVariant && (
        <>
          <EditVariantModal
            open={showEditModal}
            onClose={() => setShowEditModal(false)}
            variant={selectedVariant}
            onVariantUpdated={() => {
              fetchData();
              setShowEditModal(false);
            }}
          />

          <DeleteVariantModal
            open={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            variant={selectedVariant}
            onVariantDeleted={() => {
              fetchData();
              setShowDeleteModal(false);
            }}
          />
        </>
      )}
    </div>
  );
}
