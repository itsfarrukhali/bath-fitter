// src/components/admin/templates/variants/edit-template-variant-modal.tsx
"use client";

import { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import { Loader2, Pencil, Upload } from "lucide-react";
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
import { toast } from "sonner";
import { TemplateVariant } from "@/types/template";

interface Props {
  templateVariant: TemplateVariant;
  onVariantUpdated: () => void;
}

export default function EditTemplateVariantModal({
  templateVariant,
  onVariantUpdated,
}: Props) {
  const [open, setOpen] = useState(false);
  const [colorName, setColorName] = useState("");
  const [colorCode, setColorCode] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    if (open) {
      setColorName(templateVariant.colorName);
      setColorCode(templateVariant.colorCode || "");
      setImageUrl(templateVariant.imageUrl);
    }
  }, [open, templateVariant]);

  const handleImageUpload = async (file: File) => {
    setImageUploading(true);
    try {
      // TODO: Implement actual image upload
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const mockUrl = `https://picsum.photos/400/300?random=${Date.now()}`;
      setImageUrl(mockUrl);
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!colorName.trim()) {
      toast.error("Color name is required");
      return;
    }
    if (!imageUrl.trim()) {
      toast.error("Image is required");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.put(
        `/api/template-variants/${templateVariant.id}`,
        {
          colorName: colorName.trim(),
          colorCode: colorCode.trim() || null,
          imageUrl: imageUrl.trim(),
        }
      );

      if (data.success) {
        toast.success("Template variant updated successfully");
        onVariantUpdated();
        setOpen(false);
      } else {
        toast.error(data.message || "Failed to update template variant");
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(
          err.response?.data?.message || "Failed to update template variant"
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

      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Template Variant</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="colorName">Color Name *</Label>
              <Input
                id="colorName"
                placeholder="Enter color name"
                value={colorName}
                onChange={(e) => setColorName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="colorCode">Color Code (Optional)</Label>
              <Input
                id="colorCode"
                placeholder="Enter HEX color code"
                value={colorCode}
                onChange={(e) => setColorCode(e.target.value)}
                disabled={loading}
              />
              {colorCode && (
                <div className="flex items-center gap-2 mt-2">
                  <div
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: colorCode }}
                  />
                  <span className="text-xs text-muted-foreground">
                    Color preview
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Variant Image *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {imageUrl ? (
                  <div className="space-y-2">
                    <img
                      src={imageUrl}
                      alt="Variant preview"
                      className="mx-auto h-32 object-cover rounded"
                    />
                    <p className="text-sm text-green-600">Current image</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() =>
                        document.getElementById("file-upload-edit")?.click()
                      }
                      disabled={imageUploading}
                    >
                      {imageUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Change Image"
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-gray-400 cursor-pointer" />
                    <p className="text-sm text-gray-600">No image selected</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        document.getElementById("file-upload-edit")?.click()
                      }
                      disabled={imageUploading}
                      className="cursor-pointer"
                    >
                      {imageUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Upload Image"
                      )}
                    </Button>
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="file-upload-edit"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                />
              </div>
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
              disabled={loading || !imageUrl}
              className="flex items-center gap-2 cursor-pointer"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Update Variant
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
