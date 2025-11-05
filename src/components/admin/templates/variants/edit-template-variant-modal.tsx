// src/components/admin/templates/variants/edit-template-variant-modal.tsx
"use client";

import { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import { Loader2, Pencil, Upload, Settings } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { TemplateVariant, PlumbingConfig } from "@/types/template";
import Image from "next/image";

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
  const [publicId, setPublicId] = useState("");
  const [plumbingConfig, setPlumbingConfig] = useState<PlumbingConfig>(
    PlumbingConfig.LEFT
  );
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    if (open) {
      setColorName(templateVariant.colorName);
      setColorCode(templateVariant.colorCode || "");
      setImageUrl(templateVariant.imageUrl);
      setPublicId(templateVariant.publicId || "");
      setPlumbingConfig(templateVariant.plumbingConfig || PlumbingConfig.LEFT);
    }
  }, [open, templateVariant]);

  const handleImageUpload = async (file: File) => {
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Use the same folder structure as create modal
      const folder = `templates/products/${templateVariant.templateProductId}/variants`;
      formData.append("folder", folder);

      // Include existing image URL for deletion if needed
      if (templateVariant.imageUrl) {
        formData.append("existingImageUrl", templateVariant.imageUrl);
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setImageUrl(data.imageUrl);
        setPublicId(data.publicId);
        toast.success("Image uploaded successfully");
      } else {
        throw new Error(data.message || "Failed to upload image");
      }
    } catch (err: unknown) {
      console.error("Upload error:", err);
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Failed to upload image");
      }
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
          publicId: publicId,
          plumbingConfig,
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

  const getPlumbingConfigBadge = (config: PlumbingConfig) => {
    const configStyles = {
      [PlumbingConfig.LEFT]: "bg-blue-500 text-white",
      [PlumbingConfig.RIGHT]: "bg-green-500 text-white",
      [PlumbingConfig.BOTH]: "bg-purple-500 text-white",
    };

    return (
      <Badge className={`text-xs ${configStyles[config]}`}>
        {config.toLowerCase()}
      </Badge>
    );
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

      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Template Variant</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="colorName">Color Name *</Label>
                  <Input
                    id="colorName"
                    placeholder="Enter color name"
                    value={colorName}
                    onChange={(e) => setColorName(e.target.value)}
                    disabled={loading || imageUploading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="colorCode">Color Code (Optional)</Label>
                  <Input
                    id="colorCode"
                    placeholder="Enter HEX color code"
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
              </CardContent>
            </Card>

            {/* Plumbing Configuration */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Plumbing Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="plumbingConfig">Plumbing Type *</Label>
                  <Select
                    value={plumbingConfig}
                    onValueChange={(value: PlumbingConfig) =>
                      setPlumbingConfig(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select plumbing type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PlumbingConfig.LEFT}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded" />
                          Left Plumbing
                        </div>
                      </SelectItem>
                      <SelectItem value={PlumbingConfig.RIGHT}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded" />
                          Right Plumbing
                        </div>
                      </SelectItem>
                      <SelectItem value={PlumbingConfig.BOTH}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-purple-500 rounded" />
                          Both Plumbing Types
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                  <h4 className="text-sm font-medium">What this means:</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {plumbingConfig === PlumbingConfig.LEFT && (
                      <>
                        <li>
                          • This variant is optimized for left-handed plumbing
                        </li>
                        <li>
                          • Images will be used as-is for left plumbing
                          instances
                        </li>
                        <li>
                          • May be mirrored for right plumbing if auto-mirroring
                          is enabled
                        </li>
                      </>
                    )}
                    {plumbingConfig === PlumbingConfig.RIGHT && (
                      <>
                        <li>
                          • This variant is optimized for right-handed plumbing
                        </li>
                        <li>
                          • Images will be used as-is for right plumbing
                          instances
                        </li>
                        <li>
                          • May be mirrored for left plumbing if auto-mirroring
                          is enabled
                        </li>
                      </>
                    )}
                    {plumbingConfig === PlumbingConfig.BOTH && (
                      <>
                        <li>
                          • This variant works for both left and right plumbing
                        </li>
                        <li>
                          • Images will not be mirrored during instantiation
                        </li>
                        <li>• Suitable for symmetrical products</li>
                      </>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Image Upload */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Variant Image *
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {imageUrl ? (
                    <div className="space-y-3">
                      <div className="mx-auto relative">
                        <Image
                          src={imageUrl}
                          alt="Variant preview"
                          width={150}
                          height={150}
                          className="mx-auto h-32 w-32 object-cover rounded-lg border"
                        />
                        <div className="absolute -top-2 -left-2">
                          {getPlumbingConfigBadge(plumbingConfig)}
                        </div>
                      </div>
                      <p className="text-sm text-green-600">Current image</p>
                      <div className="flex gap-2 justify-center">
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
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setImageUrl("");
                            setPublicId("");
                          }}
                          disabled={imageUploading}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="h-12 w-12 mx-auto text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">
                          {imageUploading
                            ? "Uploading image..."
                            : "Upload variant image"}
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                      <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="file-upload-edit"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                        }}
                        disabled={imageUploading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          document.getElementById("file-upload-edit")?.click()
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
                          "Choose File"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading || imageUploading}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || imageUploading || !imageUrl}
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
