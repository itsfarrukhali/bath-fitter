// components/admin/products/delete-product-modal.tsx
"use client";

import { useState } from "react";
import axios from "axios";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Product } from "@/types/products";

interface Props {
  open: boolean;
  onClose: () => void;
  product: Product;
  onProductDeleted: () => void;
}

export default function DeleteProductModal({
  open,
  onClose,
  product,
  onProductDeleted,
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!product) return;

    setLoading(true);
    try {
      const { data } = await axios.delete(`/api/products/${product.id}`);

      if (data.success) {
        toast.success("Product deleted successfully");
        onProductDeleted();
        onClose();
      } else {
        toast.error(data.message || "Failed to delete product");
      }
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.response?.data?.message || "Failed to delete product");
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete Product
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This action cannot be undone. This will permanently delete the
              product and all its variants.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <p className="font-medium">Product Details:</p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                <strong>Name:</strong> {product.name}
              </p>
              <p>
                <strong>Category:</strong> {product.category.name}
              </p>
              <p>
                <strong>Variants:</strong> {product._count.variants} variant(s)
              </p>
              {product.thumbnailUrl && (
                <img
                  src={product.thumbnailUrl}
                  alt={product.name}
                  className="w-20 h-20 object-cover rounded mt-2"
                />
              )}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this product? All associated
            variants will also be deleted.
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete Product
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
