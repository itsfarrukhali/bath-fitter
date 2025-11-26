// components/admin/products/edit-product-modal.tsx
"use client";

import { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import { Loader2, Upload, X, HelpCircle } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Product } from "@/types/products";
import { Category } from "@/types/category";
import Image from "next/image";

interface Props {
  open: boolean;
  onClose: () => void;
  product: Product;
  onProductUpdated: () => void;
  categories: Category[];
}

interface UploadResponse {
  success: boolean;
  data?: {
    imageUrl: string;
    publicId: string;
  };
  message?: string;
}

// Common z-index examples for reference
const Z_INDEX_EXAMPLES = [
  { name: "Base", value: 10 },
  { name: "Walls", value: 20 },
  { name: "Wainscoting", value: 25 },
  { name: "Accessories", value: 35 },
  { name: "Doors & Rods", value: 40 },
  { name: "Ceilings", value: 50 },
  { name: "Faucets", value: 60 },
];

export default function EditProductModal({
  open,
  onClose,
  product,
  onProductUpdated,
  categories,
}: Props) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState("");
  const [zIndex, setZIndex] = useState<number | "">("");
  const [parentZIndex, setParentZIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);

  const selectedCategory = categories.find(
    (cat) => cat.id.toString() === selectedCategoryId
  );
  const availableSubcategories = selectedCategory?.subcategories || [];
  const selectedSubcategory = availableSubcategories.find(
    (sub) => sub.id.toString() === selectedSubcategoryId
  );

  useEffect(() => {
    if (open && product) {
      setName(product.name);
      setSlug(product.slug);
      setDescription(product.description || "");
      setThumbnailUrl(product.thumbnailUrl || "");
      setSelectedCategoryId(product.categoryId.toString());
      setSelectedSubcategoryId(product.subcategoryId?.toString() || "");
      setZIndex(product.z_index ?? "");
    }
  }, [open, product]);

  // Update parent Z-Index when category or subcategory changes
  useEffect(() => {
    if (
      selectedSubcategory &&
      selectedSubcategory.z_index !== null &&
      selectedSubcategory.z_index !== undefined
    ) {
      setParentZIndex(selectedSubcategory.z_index);
    } else if (
      selectedCategory &&
      selectedCategory.z_index !== null &&
      selectedCategory.z_index !== undefined
    ) {
      setParentZIndex(selectedCategory.z_index);
    } else {
      setParentZIndex(null);
    }
  }, [selectedCategory, selectedSubcategory]);

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
    if (!selectedCategoryId) {
      toast.error("Please select a category");
      return;
    }
    if (zIndex !== "" && (zIndex < 0 || zIndex > 100)) {
      toast.error("Z-Index must be between 0 and 100");
      return;
    }

    setLoading(true);
    try {
      const productData = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        thumbnailUrl: thumbnailUrl.trim() || null,
        categoryId: parseInt(selectedCategoryId),
        subcategoryId: selectedSubcategoryId
          ? parseInt(selectedSubcategoryId)
          : undefined,
        z_index: zIndex === "" ? null : zIndex,
      };

      const { data } = await axios.put(
        `/api/products/${product.id}`,
        productData
      );

      if (data.success) {
        toast.success("Product updated successfully");
        onProductUpdated();
        onClose();
      } else {
        toast.error(data.message || "Failed to update product");
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(err.response?.data?.message || "Failed to update product");
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleZIndexChange = (value: string) => {
    if (value === "") {
      setZIndex("");
    } else {
      const numValue = parseInt(value);
      if (!isNaN(numValue)) {
        setZIndex(numValue);
      }
    }
  };

  const handleUseParentZIndex = () => {
    if (parentZIndex !== null) {
      setZIndex(parentZIndex);
    }
  };

  const isFormValid = name?.trim() && slug?.trim() && selectedCategoryId;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Thumbnail Upload */}
            <div className="space-y-2">
              <Label htmlFor="thumbnail">Product Thumbnail</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {thumbnailUrl ? (
                  <div className="space-y-3">
                    <div className="relative inline-block mx-auto">
                      <div className="relative h-32 w-32">
                        <Image
                          src={thumbnailUrl}
                          alt="Product thumbnail"
                          fill
                          className="object-cover rounded-lg"
                          sizes="128px"
                        />
                      </div>
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
                      onClick={() =>
                        document
                          .getElementById("thumbnail-upload-edit")
                          ?.click()
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
                    <p className="text-sm text-gray-600">
                      Upload product thumbnail
                    </p>
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="thumbnail-upload-edit"
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
                        document
                          .getElementById("thumbnail-upload-edit")
                          ?.click()
                      }
                      disabled={thumbnailUploading}
                      className="flex items-center gap-2"
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
                  setSelectedSubcategoryId("");
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
                      {category.z_index && ` - Z:${category.z_index}`}
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
                        {subcategory.z_index && ` - Z:${subcategory.z_index}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Z-Index Field */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="z_index">Z-Index ?</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold mb-2">What is Z-Index?</p>
                      <p className="text-sm mb-2">
                        Z-Index determines the stacking order of elements in the
                        3D configurator. Lower numbers render behind higher
                        numbers.
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        By default, products inherit Z-Index from their parent
                        category/subcategory.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Examples: Base (10), Walls (20), Wainscoting (25),
                        Accessories (35), Doors & Rods (40), Ceilings (50),
                        Faucets (60)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex gap-2">
                <Input
                  id="z_index"
                  type="number"
                  min="0"
                  max="100"
                  placeholder={
                    parentZIndex !== null ? parentZIndex.toString() : "50"
                  }
                  value={zIndex}
                  onChange={(e) => handleZIndexChange(e.target.value)}
                  className="flex-1"
                />
                {parentZIndex !== null && zIndex !== parentZIndex && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUseParentZIndex}
                    className="whitespace-nowrap cursor-pointer"
                  >
                    Use Parent ({parentZIndex})
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                <span>Common values:</span>
                {Z_INDEX_EXAMPLES.map((example, index) => (
                  <span key={example.name} className="flex items-center">
                    {example.name} ({example.value})
                    {index < Z_INDEX_EXAMPLES.length - 1 && <span>,</span>}
                  </span>
                ))}
              </div>
              {parentZIndex !== null && (
                <p className="text-xs text-blue-600">
                  Parent {selectedSubcategory ? "Subcategory" : "Category"}{" "}
                  Z-Index: {parentZIndex}
                </p>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading || thumbnailUploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                disabled={loading || thumbnailUploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
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
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || thumbnailUploading || !isFormValid}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Product"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
