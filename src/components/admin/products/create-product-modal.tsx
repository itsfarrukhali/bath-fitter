// src/components/admin/products/create-product-modal.tsx
"use client";

import { useState, useEffect } from "react";
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
import { Category } from "@/types/category";
import Image from "next/image";

interface Props {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  onProductCreated: () => void;
}

interface UploadResponse {
  success: boolean;
  imageUrl?: string;
  publicId?: string;
  message?: string;
}

export default function CreateProductModal({
  open,
  onClose,
  categories,
  onProductCreated,
}: Props) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedSubcategoryId, setSelectedSubcategoryId] =
    useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);

  const selectedCategory = categories.find(
    (cat) => cat.id.toString() === selectedCategoryId
  );
  const availableSubcategories = selectedCategory?.subcategories || [];

  useEffect(() => {
    if (open) {
      setName("");
      setSlug("");
      setDescription("");
      setThumbnailUrl("");
      setSelectedCategoryId("");
      setSelectedSubcategoryId("");
      setIsSlugManual(false);
      setLoading(false);
      setThumbnailUploading(false);
    }
  }, [open]);

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
      formData.append("folder", "products/thumbnails");

      const response = await axios.post<UploadResponse>(
        "/api/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data.success && response.data.imageUrl) {
        setThumbnailUrl(response.data.imageUrl);
        toast.success("Product thumbnail uploaded successfully");
      } else {
        throw new Error(response.data.message || "Failed to upload thumbnail");
      }
    } catch (error: unknown) {
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
    if (!selectedCategoryId) {
      toast.error("Please select a category");
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
        thumbnailUrl: thumbnailUrl.trim(),
        categoryId: parseInt(selectedCategoryId),
        subcategoryId: selectedSubcategoryId
          ? parseInt(selectedSubcategoryId)
          : undefined,
      };

      const { data } = await axios.post("/api/products", productData);

      if (data.success) {
        toast.success("Product created successfully");
        onProductCreated();
        onClose();
      } else {
        toast.error(data.message || "Failed to create product");
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(err.response?.data?.message || "Failed to create product");
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    name?.trim() && slug?.trim() && thumbnailUrl?.trim() && selectedCategoryId;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Product</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Thumbnail Upload */}
            <div className="space-y-2">
              <Label htmlFor="thumbnail">Product Thumbnail *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {thumbnailUrl ? (
                  <div className="space-y-3">
                    <div className="relative inline-block mx-auto">
                      <Image
                        src={thumbnailUrl}
                        alt="Product thumbnail"
                        className="h-32 w-32 object-cover rounded-lg"
                        width={60}
                        height={60}
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
                    <p className="text-sm text-green-600">Thumbnail uploaded</p>
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
                ) : (
                  <div className="space-y-3">
                    <Upload className="h-12 w-12 mx-auto text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">
                        {thumbnailUploading
                          ? "Uploading..."
                          : "Upload product thumbnail"}
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
                      className="cursor-pointer"
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
            </div>

            {/* Category Selection */}
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={selectedCategoryId}
                onValueChange={(value) => {
                  setSelectedCategoryId(value);
                  setSelectedSubcategoryId(""); // Reset subcategory when category changes
                }}
                disabled={loading || thumbnailUploading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id.toString()}
                    >
                      {category.name} ({category.showerType.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subcategory Selection */}
            {selectedCategory?.hasSubcategories && (
              <div className="space-y-2">
                <Label htmlFor="subcategory">Subcategory (Optional)</Label>
                <Select
                  value={selectedSubcategoryId}
                  onValueChange={setSelectedSubcategoryId}
                  disabled={loading || thumbnailUploading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubcategories.map((subcategory) => (
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
            )}

            {/* Product Details */}
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Classic Shower Base"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading || thumbnailUploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                placeholder="e.g., classic-shower-base"
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
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading || thumbnailUploading}
              className="cursor-pointer"
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
