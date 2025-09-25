// components/admin/variants/edit-variant-modal.tsx
"use client";

import { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import { Loader2, Upload, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ProductVariant } from "@/types/products";
import Image from "next/image";

interface Props {
  open: boolean;
  onClose: () => void;
  variant: ProductVariant;
  onVariantUpdated: () => void;
}

interface UploadResponse {
  success: boolean;
  imageUrl?: string;
  publicId?: string;
  message?: string;
}

export default function EditVariantModal({
  open,
  onClose,
  variant,
  onVariantUpdated,
}: Props) {
  const [colorName, setColorName] = useState("");
  const [colorCode, setColorCode] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    if (open && variant) {
      setColorName(variant.colorName || "");
      setColorCode(variant.colorCode || "");
      setImageUrl(variant.imageUrl || "");
    }
  }, [open, variant]);

  const handleImageUpload = async (file: File) => {
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", `products/variants/${variant.productId}`);

      const response = await axios.post<UploadResponse>(
        "/api/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data.success && response.data.imageUrl) {
        setImageUrl(response.data.imageUrl);
        toast.success("Variant image uploaded successfully");
      } else {
        throw new Error(response.data.message || "Failed to upload image");
      }
    } catch (error) {
      console.error("Upload error:", error);
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message || "Failed to upload image");
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to upload image");
      }
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!colorName?.trim()) {
      toast.error("Color name is required");
      return;
    }
    if (!imageUrl?.trim()) {
      toast.error("Variant image is required");
      return;
    }

    setLoading(true);
    try {
      const variantData = {
        colorName: colorName.trim(),
        colorCode: colorCode.trim() || null,
        imageUrl: imageUrl.trim(),
      };

      const { data } = await axios.put(
        `/api/variants/${variant.id}`,
        variantData
      );

      if (data.success) {
        toast.success("Variant updated successfully");
        onVariantUpdated();
        onClose();
      } else {
        toast.error(data.message || "Failed to update variant");
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(err.response?.data?.message || "Failed to update variant");
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = colorName?.trim() && imageUrl?.trim();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Variant</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {variant.product?.name || "Product"}
            </p>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Variant Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="image">Variant Image *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {imageUrl ? (
                  <div className="space-y-2">
                    <div className="relative inline-block mx-auto">
                      <Image
                        src={imageUrl}
                        alt="Variant preview"
                        className="h-32 w-32 object-cover rounded-lg"
                        width={60}
                        height={60}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 cursor-pointer"
                        onClick={() => setImageUrl("")}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-green-600">Image uploaded</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        document
                          .getElementById("variant-image-upload-edit")
                          ?.click()
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
                    <Upload className="h-8 w-8 mx-auto text-gray-400" />
                    <p className="text-sm text-gray-600">
                      Upload variant image
                    </p>
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="variant-image-upload-edit"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                      disabled={imageUploading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        document
                          .getElementById("variant-image-upload-edit")
                          ?.click()
                      }
                      disabled={imageUploading}
                      className="flex items-center gap-2"
                    >
                      {imageUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        "Upload Image"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Variant Details */}
            <div className="space-y-2">
              <Label htmlFor="colorName">Color Name *</Label>
              <Input
                id="colorName"
                value={colorName}
                onChange={(e) => setColorName(e.target.value)}
                disabled={loading || imageUploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="colorCode">Color Code (Optional)</Label>
              <Input
                id="colorCode"
                value={colorCode}
                onChange={(e) => setColorCode(e.target.value)}
                disabled={loading || imageUploading}
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
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading || imageUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || imageUploading || !isFormValid}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Variant"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
