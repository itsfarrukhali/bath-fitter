// src/components/admin/templates/edit-template-product-modal.tsx
"use client";

import { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import { Loader2, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import generateSlug from "@/utils/generateSlug";

interface TemplateProduct {
  id: number;
  name: string;
  slug: string;
  description?: string;
  templateCategoryId?: number;
  templateSubcategoryId?: number;
}

interface Props {
  templateProduct: TemplateProduct;
  onProductUpdated: () => void;
}

export default function EditTemplateProductModal({
  templateProduct,
  onProductUpdated,
}: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSlugManual, setIsSlugManual] = useState(false);

  useEffect(() => {
    if (open) {
      setName(templateProduct.name);
      setSlug(templateProduct.slug);
      setDescription(templateProduct.description || "");
      setIsSlugManual(false);
    }
  }, [open, templateProduct]);

  // Auto-generate slug when name changes
  useEffect(() => {
    if (name.trim() && !isSlugManual) {
      setSlug(generateSlug(name));
    }
  }, [name, isSlugManual]);

  const handleSlugChange = (value: string) => {
    setSlug(value);
    setIsSlugManual(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!slug.trim()) {
      toast.error("Slug is required");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.put(
        `/api/template-products/${templateProduct.id}`,
        {
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
        }
      );

      if (data.success) {
        toast.success("Template product updated successfully");
        onProductUpdated();
        setOpen(false);
      } else {
        toast.error(data.message || "Failed to update template product");
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(
          err.response?.data?.message || "Failed to update template product"
        );
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8 cursor-pointer"
        >
          <Pencil className="h-3 w-3" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Template Product</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                placeholder="Enter product name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                placeholder="Enter slug"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Use lowercase letters, numbers, and hyphens
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Enter product description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 cursor-pointer"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Update Product
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
