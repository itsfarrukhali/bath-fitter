// src/components/admin/templates/variants/delete-template-variant-modal.tsx
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

interface Props {
  templateVariant: TemplateVariant;
  onVariantDeleted: () => void;
}

export default function DeleteTemplateVariantModal({
  templateVariant,
  onVariantDeleted,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { data } = await axios.delete(
        `/api/template-variants/${templateVariant.id}`
      );

      if (data.success) {
        toast.success("Template variant deleted successfully");
        onVariantDeleted();
        setOpen(false);
      } else {
        toast.error(data.message || "Failed to delete template variant");
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(
          err.response?.data?.message || "Failed to delete template variant"
        );
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  // Safe access using optional chaining
  const productName =
    templateVariant.templateProduct?.name || "Unknown Product";
  const colorName = templateVariant.colorName || "Unknown Variant";

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
          <DialogTitle>Delete Template Variant</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the variant &apos;{colorName}&apos;?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded">
          {templateVariant.colorCode && (
            <div
              className="w-8 h-8 rounded border"
              style={{ backgroundColor: templateVariant.colorCode }}
            />
          )}
          <div>
            <p className="font-medium">{colorName}</p>
            <p className="text-sm text-muted-foreground">
              Product: {productName}
            </p>
          </div>
        </div>

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
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-2 cursor-pointer"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete Variant
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
