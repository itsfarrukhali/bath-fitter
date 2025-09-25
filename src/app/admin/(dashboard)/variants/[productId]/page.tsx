// app/admin/variants/[productId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import CreateVariantModal from "@/components/admin/variants/create-variant-modal";
import EditVariantModal from "@/components/admin/variants/edit-variant-modal";
import DeleteVariantModal from "@/components/admin/variants/delete-variant-modal";
import { Product, ProductVariant } from "@/types/products";
import Image from "next/image";

export default function ProductVariantsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = parseInt(params.productId as string);

  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );

  useEffect(() => {
    if (productId) {
      fetchProductAndVariants();
    }
  }, [productId]);

  const fetchProductAndVariants = async () => {
    try {
      setLoading(true);
      const [productResponse, variantsResponse] = await Promise.all([
        axios.get(`/api/products/${productId}`),
        axios.get(`/api/variants?productId=${productId}`),
      ]);

      if (productResponse.data.success) {
        setProduct(productResponse.data.data);
      }
      if (variantsResponse.data.success) {
        setVariants(variantsResponse.data.data);
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to fetch variant");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to fetch variant");
      }
      toast.error("Failed to fetch variant");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setEditModalOpen(true);
  };

  const handleDelete = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setDeleteModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto py-6 text-center">
        <p>Product not found</p>
        <Button onClick={() => router.push("/admin/products")} className="mt-4">
          Back to Products
        </Button>
      </div>
    );
  }

  if (error) {
    <div className="p-4 border border-destructive/50 rounded-md bg-destructive/10">
      <p className="text-destructive">{error}</p>
      <Button
        variant="outline"
        size="sm"
        className="mt-2 cursor-pointer"
        onClick={fetchProductAndVariants}
      >
        Try Again
      </Button>
    </div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/admin/products")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-muted-foreground">
            Manage variants for {product.name}
          </p>
          <div className="flex gap-2 mt-2">
            <Badge variant="secondary">{product.category.name}</Badge>
            {product.subcategory && (
              <Badge variant="outline">{product.subcategory.name}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">
          {variants.length} variant{variants.length !== 1 ? "s" : ""}
        </p>
        <CreateVariantModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          product={product}
          onVariantCreated={fetchProductAndVariants}
        />
      </div>

      {/* Variants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {variants.map((variant) => (
          <Card key={variant.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Variant Image */}
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  {variant.imageUrl ? (
                    <Image
                      src={variant.imageUrl}
                      alt={variant.colorName}
                      className="w-full h-full object-cover rounded-lg"
                      width={80}
                      height={80}
                    />
                  ) : (
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>

                {/* Variant Info */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">{variant.colorName}</h3>
                  {variant.colorCode && (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: variant.colorCode }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {variant.colorCode}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(variant)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(variant)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {variants.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground mt-4">No variants yet</p>
            <p className="text-sm text-muted-foreground">
              Add your first variant to get started
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {selectedVariant && (
        <>
          <EditVariantModal
            open={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            variant={selectedVariant}
            onVariantUpdated={fetchProductAndVariants}
          />
          <DeleteVariantModal
            open={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            variant={selectedVariant}
            onVariantDeleted={fetchProductAndVariants}
          />
        </>
      )}
    </div>
  );
}
