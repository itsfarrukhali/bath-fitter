// src/components/admin/templates/delete-template-product-modal.tsx
"use client";

import { useState } from "react";
import axios, { AxiosError } from "axios";
import { Loader2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { TemplateVariant } from "@/types/template";

interface TemplateProduct {
  id: number;
  name: string;
  slug: string;
  templateVariants: TemplateVariant[];
}

interface Props {
  templateProduct: TemplateProduct;
  onProductDeleted: () => void;
}

export default function DeleteTemplateProductModal({
  templateProduct,
  onProductDeleted,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { data } = await axios.delete(
        `/api/template-products/${templateProduct.id}`
      );

      if (data.success) {
        toast.success("Template product deleted successfully");
        onProductDeleted();
        setOpen(false);
      } else {
        toast.error(data.message || "Failed to delete template product");
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const errorMessage =
          err.response?.data?.message || "Failed to delete template product";

        if (err.response?.status === 400) {
          // Specific error for products with variants
          toast.error(errorMessage, {
            duration: 5000,
            description: "Please remove all variants first.",
          });
        } else {
          toast.error(errorMessage);
        }
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const variantCount = templateProduct.templateVariants?.length || 0;
  const canDelete = variantCount === 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="destructive"
          className="h-8 w-8 cursor-pointer"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Template Product</DialogTitle>
          <DialogDescription>
            {canDelete
              ? `Are you sure you want to delete "${templateProduct.name}"? This action cannot be undone.`
              : `Cannot delete "${templateProduct.name}" because it contains ${variantCount} variant(s).`}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!canDelete || loading}
            onClick={handleDelete}
            className="flex items-center gap-2 cursor-pointer"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete Product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
