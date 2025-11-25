// src/components/admin/shower-types/edit-shower-type-modal.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { ShowerType, ProjectType } from "@/types/shower-types";
import ImageUpload from "@/components/admin/shared/image-upload";

interface Props {
  showerType: ShowerType;
  onShowerTypeUpdated: (showerType: ShowerType) => void;
}

export default function EditShowerTypeModal({
  showerType,
  onShowerTypeUpdated,
}: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(showerType.name);
  const [slug, setSlug] = useState(showerType.slug);
  const [projectTypeId, setProjectTypeId] = useState<string>(
    showerType.projectTypeId.toString()
  );
  const [imageUrl, setImageUrl] = useState<string | null>(showerType.imageUrl || null);
  const [baseImageLeft, setBaseImageLeft] = useState<string | null>(showerType.baseImageLeft || null);
  const [baseImageRight, setBaseImageRight] = useState<string | null>(showerType.baseImageRight || null);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingProjectTypes, setFetchingProjectTypes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      // Reset form to current shower type values
      setName(showerType.name);
      setSlug(showerType.slug);
      setProjectTypeId(showerType.projectTypeId.toString());
      setImageUrl(showerType.imageUrl || null);
      setBaseImageLeft(showerType.baseImageLeft || null);
      setBaseImageRight(showerType.baseImageRight || null);
      setError(null);
      fetchProjectTypes();
    }
  }, [open, showerType]);

  const fetchProjectTypes = async () => {
    setFetchingProjectTypes(true);
    try {
      const { data } = await axios.get("/api/project-types");
      if (data.success) {
        setProjectTypes(data.data);
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError(
          err.response?.data?.message || "Failed to fetch project types"
        );
        toast.error("Failed to fetch project types");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to fetch project types");
      }
    } finally {
      setFetchingProjectTypes(false);
    }
  };

  const handleUpdate = async () => {
    if (!name.trim()) return setError("Name is required");
    if (!slug.trim()) return setError("Slug is required");
    if (!projectTypeId) return setError("Project type is required");

    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.patch(`/api/shower-types/${showerType.id}`, {
        name,
        slug,
        projectTypeId: parseInt(projectTypeId),
        imageUrl,
        baseImageLeft,
        baseImageRight,
      });

      if (!data.success) throw new Error(data.message);
      toast.success("Shower type updated successfully");

      onShowerTypeUpdated(data.data);
      setOpen(false);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to update shower type");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to update shower type");
      }
      toast.error("Failed to update shower type");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (slug === generateSlug(showerType.name)) {
      setSlug(generateSlug(value));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer" size="icon" variant="outline">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Shower Type</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {error && (
            <div className="text-sm text-red-500 bg-red-50 border border-red-200 p-2 rounded">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Basic Information</h3>

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Enter shower type name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                placeholder="Enter slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This will be used in URLs. Use lowercase letters, numbers, and
                hyphens.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectType">Project Type *</Label>
              <Select
                value={projectTypeId}
                onValueChange={setProjectTypeId}
                disabled={fetchingProjectTypes}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent>
                  {projectTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fetchingProjectTypes && (
                <p className="text-xs text-muted-foreground">
                  Loading project types...
                </p>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-4">Shower Type Display Image</h3>
            <ImageUpload
              label="Shower Type Image"
              value={imageUrl}
              onChange={setImageUrl}
              folder="shower-types"
              helpText="Upload or replace the shower type image for listings"
            />
          </div>

          {/* Base Images for Plumbing Configurations */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-2">Base Images for Design Canvas</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Upload or replace base images for different plumbing configurations
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ImageUpload
                label="Left Plumbing Base Image"
                value={baseImageLeft}
                onChange={setBaseImageLeft}
                folder="shower-types/base-images"
                helpText="Base image for LEFT plumbing configuration"
              />

              <ImageUpload
                label="Right Plumbing Base Image"
                value={baseImageRight}
                onChange={setBaseImageRight}
                folder="shower-types/base-images"
                helpText="Base image for RIGHT plumbing configuration"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            className="cursor-pointer"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            disabled={loading}
            onClick={handleUpdate}
            className="flex items-center gap-2 cursor-pointer"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
