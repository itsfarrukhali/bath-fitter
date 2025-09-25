// components/admin/variants/delete-variant-modal.tsx
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
import { ProductVariant } from "@/types/products";

interface Props {
  open: boolean;
  onClose: () => void;
  variant: ProductVariant;
  onVariantDeleted: () => void;
}

export default function DeleteVariantModal({
  open,
  onClose,
  variant,
  onVariantDeleted,
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!variant) return;

    setLoading(true);
    try {
      const { data } = await axios.delete(`/api/variants/${variant.id}`);

      if (data.success) {
        toast.success("Variant deleted successfully");
        onVariantDeleted();
        onClose();
      } else {
        toast.error(data.message || "Failed to delete variant");
      }
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.response?.data?.message || "Failed to delete variant");
    } finally {
      setLoading(false);
    }
  };

  if (!variant) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete Variant
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This action cannot be undone. This will permanently delete the
              variant.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <p className="font-medium">Variant Details:</p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                <strong>Color Name:</strong> {variant.colorName || "N/A"}
              </p>
              <p>
                <strong>Product:</strong> {variant.product?.name || "N/A"}
              </p>
              {variant.colorCode && (
                <p>
                  <strong>Color Code:</strong> {variant.colorCode}
                </p>
              )}
            </div>
            <img
              src={variant.imageUrl}
              alt={variant.colorName || "Variant image"}
              className="w-32 h-32 object-cover rounded mt-2"
            />
          </div>

          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this variant?
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
                Delete Variant
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
