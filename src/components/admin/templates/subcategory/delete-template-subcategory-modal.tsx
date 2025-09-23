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
import { TemplateProduct } from "@/types/template";

interface TemplateSubcategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  templateProducts: TemplateProduct[];
}

interface Props {
  templateSubcategory: TemplateSubcategory;
  onSubcategoryDeleted: () => void;
}

export default function DeleteTemplateSubcategoryModal({
  templateSubcategory,
  onSubcategoryDeleted,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { data } = await axios.delete(
        `/api/template-subcategories/${templateSubcategory.id}`
      );

      if (data.success) {
        toast.success("Template subcategory deleted successfully");
        onSubcategoryDeleted();
        setOpen(false);
      } else {
        toast.error(data.message || "Failed to delete template subcategory");
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const errorMessage =
          err.response?.data?.message ||
          "Failed to delete template subcategory";

        if (err.response?.status === 400) {
          // Specific error for subcategories with content
          toast.error(errorMessage, {
            duration: 5000,
            description: "Please remove all products and subcategories first.",
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

  const productCount = templateSubcategory.templateProducts.length;
  const canDelete = productCount === 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="destructive" className="h-8 w-8">
          <Trash2 className="h-3 w-3" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Template Subcategory</DialogTitle>
          <DialogDescription>
            {canDelete
              ? `Are you sure you want to delete "${templateSubcategory.name}"? This action cannot be undone.`
              : `Cannot delete "${templateSubcategory.name}" because it contains ${productCount} product(s).`}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!canDelete || loading}
            onClick={handleDelete}
            className="flex items-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete Subcategory
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
