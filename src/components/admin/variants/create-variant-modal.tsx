// components/admin/variants/create-variant-modal.tsx
"use client";

import { useState } from "react";
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
import { Product, PlumbingConfig } from "@/types/products";
import Image from "next/image";

interface Props {
  open: boolean;
  onClose: () => void;
  product: Product;
  onVariantCreated: () => void;
}

interface UploadResponse {
  success: boolean;
  data?: {
    imageUrl: string;
    publicId: string;
  };
  message?: string;
}

export default function CreateVariantModal({
  open,
  onClose,
  product,
  onVariantCreated,
}: Props) {
  const [colorName, setColorName] = useState("");
  const [colorCode, setColorCode] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [plumbingConfig, setPlumbingConfig] = useState<PlumbingConfig | "">("");
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const handleImageUpload = async (file: File) => {
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", `products/variants/${product.id}`);

      const response = await axios.post<UploadResponse>(
        "/api/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      // The API returns the data wrapped in a 'data' property
      if (response.data.success && response.data.data?.imageUrl) {
        setImageUrl(response.data.data.imageUrl);
        toast.success("Variant image uploaded successfully");
      } else {
        toast.error(response.data.message || "Failed to upload image");
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
        productId: product.id,
        plumbing_config: plumbingConfig === "" ? null : plumbingConfig,
      };

      const { data } = await axios.post("/api/variants", variantData);

      if (data.success) {
        toast.success("Product variant created successfully");
        onVariantCreated();
        onClose();
        // Reset form
        setColorName("");
        setColorCode("");
        setImageUrl("");
        setPlumbingConfig("");
      } else {
        toast.error(data.message || "Failed to create variant");
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(err.response?.data?.message || "Failed to create variant");
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
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Variant to {product.name}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {product.category?.showerType?.name || "N/A"} →{" "}
              {product.category?.name || "N/A"}
            </p>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Important Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-800 mb-1">
                    📝 Important Upload Instructions
                  </h4>
                  <p className="text-xs text-blue-700">
                    Please upload <strong>LEFT SIDE</strong> images for all
                    variants. The system will automatically handle mirroring
                    based on plumbing configuration.
                  </p>
                </div>
              </div>
            </div>

            {/* Variant Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="image">Variant Image (Left Side) *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {imageUrl ? (
                  <div className="space-y-2">
                    <div className="relative inline-block mx-auto">
                      <Image
                        src={imageUrl}
                        alt="Variant preview"
                        className="h-32 w-32 object-cover rounded-lg"
                        width={80}
                        height={80}
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
                      className="cursor-pointer"
                      onClick={() =>
                        document.getElementById("variant-image-upload")?.click()
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
                      Upload LEFT SIDE variant image
                    </p>
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="variant-image-upload"
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
                        document.getElementById("variant-image-upload")?.click()
                      }
                      disabled={imageUploading}
                      className="cursor-pointer"
                    >
                      {imageUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        "Upload Left Side Image"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Plumbing Configuration */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="plumbing_config">
                  Plumbing Configuration ?
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <div className="space-y-2">
                        <p className="font-semibold">
                          What is Plumbing Configuration?
                        </p>
                        <div className="text-sm space-y-1">
                          <p>
                            <strong>Null/Not Set:</strong> Variant will be
                            mirrored for right side installations
                          </p>
                          <p>
                            <strong>Left:</strong> Variant will NOT be mirrored
                            - keeps left orientation
                          </p>
                          <p>
                            <strong>Right:</strong> Variant will NOT be mirrored
                            - keeps right orientation
                          </p>
                          <p>
                            <strong>Both:</strong> Variant will NOT be mirrored
                            - uses left image for both sides
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          💡 Always upload LEFT SIDE images. The system handles
                          mirroring automatically.
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select
                value={plumbingConfig}
                onValueChange={(value: PlumbingConfig | "") =>
                  setPlumbingConfig(value)
                }
                disabled={loading || imageUploading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select plumbing configuration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Not Set (Auto Mirror)</SelectItem>
                  <SelectItem value={PlumbingConfig.LEFT}>
                    Left (No Mirroring)
                  </SelectItem>
                  <SelectItem value={PlumbingConfig.RIGHT}>
                    Right (No Mirroring)
                  </SelectItem>
                  <SelectItem value={PlumbingConfig.BOTH}>
                    Both (No Mirroring)
                  </SelectItem>
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  <strong>Not Set:</strong> Image will be mirrored for right
                  side
                </p>
                <p>
                  <strong>Left/Right/Both:</strong> No mirroring - image stays
                  as uploaded
                </p>
              </div>
            </div>

            {/* Variant Details */}
            <div className="space-y-2">
              <Label htmlFor="colorName">Color Name *</Label>
              <Input
                id="colorName"
                placeholder="e.g., White, Chrome, Brushed Nickel"
                value={colorName}
                onChange={(e) => setColorName(e.target.value)}
                disabled={loading || imageUploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="colorCode">Color Code (Optional)</Label>
              <Input
                id="colorCode"
                placeholder="e.g., #FFFFFF, #C0C0C0"
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
                  Creating...
                </>
              ) : (
                "Create Variant"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
