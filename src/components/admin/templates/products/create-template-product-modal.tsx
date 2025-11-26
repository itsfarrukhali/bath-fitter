// src/components/admin/templates/products/create-template-product-modal.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import axios, { AxiosError } from "axios";
import { Loader2, Plus, Upload, X } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import generateSlug from "@/utils/generateSlug";
import { TemplateSubcategory } from "@/types/template";

interface Props {
  templateCategoryId: number;
  templateSubcategories: TemplateSubcategory[];
  onProductCreated: () => void;
}

interface UploadResponse {
  success: boolean;
  data?: {
    imageUrl: string;
    publicId: string;
  };
  message?: string;
}

export default function CreateTemplateProductModal({
  templateCategoryId,
  templateSubcategories,
  onProductCreated,
}: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [selectedSubcategoryId, setSelectedSubcategoryId] =
    useState<string>("none");
  const [zIndex, setZIndex] = useState(10);
  const [plumbingConfig, setPlumbingConfig] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setName("");
      setSlug("");
      setDescription("");
      setThumbnailUrl("");
      setSelectedSubcategoryId("none");
      setZIndex(10);
      setPlumbingConfig(null);
      setIsSlugManual(false);
      setLoading(false);
      setThumbnailUploading(false);
    }
  }, [open]);

  // Auto-generate slug
  useEffect(() => {
    if (name?.trim() && !isSlugManual) {
      setSlug(generateSlug(name));
    }
  }, [name, isSlugManual]);

  const handleThumbnailUpload = async (file: File) => {
    setThumbnailUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "templates/products/thumbnails");

      const response = await axios.post<UploadResponse>(
        "/api/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000, // 30 second timeout
        }
      );

      console.log("Upload response:", response.data);

      // The API returns the data wrapped in a 'data' property
      if (response.data.success && response.data.data?.imageUrl) {
        setThumbnailUrl(response.data.data.imageUrl);
        toast.success("Product thumbnail uploaded successfully");
      } else {
        toast.error(response.data.message || "Failed to upload thumbnail");
      }
    } catch (error) {
      console.error("Upload error:", error);
      if (error instanceof AxiosError) {
        toast.error(
          error.response?.data?.message || "Failed to upload thumbnail"
        );
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to upload thumbnail");
      }
    } finally {
      setThumbnailUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name?.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!slug?.trim()) {
      toast.error("Slug is required");
      return;
    }
    if (!thumbnailUrl?.trim()) {
      toast.error("Product thumbnail is required");
      return;
    }

    setLoading(true);
    try {
      const productData = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        thumbnailUrl: thumbnailUrl,
        z_index: zIndex,
        plumbing_config: plumbingConfig,
        templateCategoryId:
          selectedSubcategoryId === "none" ? templateCategoryId : null,
        templateSubcategoryId:
          selectedSubcategoryId !== "none"
            ? parseInt(selectedSubcategoryId)
            : null,
      };

      const { data } = await axios.post("/api/template-products", productData);

      if (data.success) {
        toast.success("Template product created successfully");
        onProductCreated();
        setOpen(false);
      } else {
        toast.error(data.message || "Failed to create template product");
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(
          err.response?.data?.message || "Failed to create template product"
        );
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = name?.trim() && slug?.trim() && thumbnailUrl?.trim();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Template Product</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Thumbnail Upload - REQUIRED */}
            <div className="space-y-2">
              <Label htmlFor="thumbnail">Product Thumbnail *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {thumbnailUrl ? (
                  <div className="space-y-3">
                    <div className="relative inline-block mx-auto">
                      <Image
                        src={thumbnailUrl}
                        alt="Product thumbnail"
                        width={128}
                        height={128}
                        className="h-32 w-32 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 cursor-pointer"
                        onClick={() => setThumbnailUrl("")}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-green-600">
                      Thumbnail uploaded successfully
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        onClick={() =>
                          document.getElementById("thumbnail-upload")?.click()
                        }
                        disabled={thumbnailUploading}
                      >
                        {thumbnailUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Change Thumbnail"
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="h-12 w-12 mx-auto text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">
                        {thumbnailUploading
                          ? "Uploading thumbnail..."
                          : "Upload product thumbnail"}
                      </p>
                      <p className="text-xs text-gray-500">
                        This will be used as the main product image
                      </p>
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="thumbnail-upload"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleThumbnailUpload(file);
                      }}
                      disabled={thumbnailUploading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        document.getElementById("thumbnail-upload")?.click()
                      }
                      disabled={thumbnailUploading}
                      className="flex items-center gap-2 mx-auto cursor-pointer"
                    >
                      {thumbnailUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        "Upload Thumbnail"
                      )}
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                This thumbnail will be displayed in product listings
              </p>
            </div>

            {/* Product Details */}
            <div className="space-y-2">
              <Label htmlFor="parent">Parent Category</Label>
              <Select
                value={selectedSubcategoryId}
                onValueChange={setSelectedSubcategoryId}
                disabled={loading || thumbnailUploading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent category/subcategory" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    Direct to Template Category
                  </SelectItem>
                  {templateSubcategories.map((subcategory) => (
                    <SelectItem
                      key={subcategory.id}
                      value={subcategory.id.toString()}
                    >
                      {subcategory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Genova Wall Panel"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading || thumbnailUploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                placeholder="e.g., genova-wall-panel"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setIsSlugManual(true);
                }}
                disabled={loading || thumbnailUploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Product description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={loading || thumbnailUploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zIndex">Z-Index (Layer Order)</Label>
              <Input
                id="zIndex"
                type="number"
                placeholder="e.g., 10, 20, 30"
                value={zIndex}
                onChange={(e) => setZIndex(Number(e.target.value))}
                min="0"
                disabled={loading || thumbnailUploading}
              />
              <p className="text-xs text-muted-foreground">
                Higher values appear on top. Default is 10.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plumbingConfig">Plumbing Configuration (Optional)</Label>
              <Select
                value={plumbingConfig || "none"}
                onValueChange={(value) => setPlumbingConfig(value === "none" ? null : value)}
                disabled={loading || thumbnailUploading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select plumbing type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Specific Plumbing</SelectItem>
                  <SelectItem value="LEFT">Left Plumbing</SelectItem>
                  <SelectItem value="RIGHT">Right Plumbing</SelectItem>
                  <SelectItem value="BOTH">Both Plumbing Types</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Leave as &apos;No Specific Plumbing&apos; if product works with all plumbing types.
              </p>
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => setOpen(false)}
              disabled={loading || thumbnailUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || thumbnailUploading || !isFormValid}
              className="flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Product"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
