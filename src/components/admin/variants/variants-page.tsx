// app/admin/variants/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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

export default function VariantsPage() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");

  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );

  useEffect(() => {
    if (productId) {
      fetchVariants();
      fetchProduct();
    }
  }, [productId]);

  const fetchVariants = async () => {
    if (!productId) return;

    try {
      setLoading(true);
      const { data } = await axios.get(`/api/variants?productId=${productId}`);
      if (data.success) {
        setVariants(data.data);
      }
    } catch (error) {
      console.error("Error fetching variants:", error);
      if (error instanceof AxiosError) {
        toast.error(
          error.response?.data?.message || "Failed to fetch variants"
        );
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to fetch variants");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProduct = async () => {
    if (!productId) return;

    try {
      const { data } = await axios.get(`/api/products/${productId}`);
      if (data.success) {
        setProduct(data.data);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message || "Failed to fetch product");
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to fetch product");
      }
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!productId) {
    return (
      <div className="container mx-auto p-1 text-center">
        <p className="text-muted-foreground">
          Please select a product to view variants
        </p>
        <Button
          onClick={() => window.history.back()}
          className="mt-4 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-1 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={() => window.history.back()}
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
          <Card key={variant.id} className="overflow-hidden">
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
              <Image
                src={variant.imageUrl}
                alt={variant.colorName}
                className="w-full h-48 object-cover rounded-lg"
                width={500}
                height={300}
                priority
              />

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
            fetchVariants();
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
              fetchVariants();
              setShowEditModal(false);
            }}
          />

          <DeleteVariantModal
            open={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            variant={selectedVariant}
            onVariantDeleted={() => {
              fetchVariants();
              setShowDeleteModal(false);
            }}
          />
        </>
      )}
    </div>
  );
}
