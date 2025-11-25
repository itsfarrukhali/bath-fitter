// src/components/admin/project-types/edit-project-type-modal.tsx
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
import { toast } from "sonner";
import type { ProjectType } from "@/types/project-type";
import ImageUpload from "@/components/admin/shared/image-upload";

interface Props {
  projectType: ProjectType;
  onProjectTypeUpdated: (projectType: ProjectType) => void;
}

export default function EditProjectTypeModal({
  projectType,
  onProjectTypeUpdated,
}: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(projectType.name);
  const [slug, setSlug] = useState(projectType.slug);
  const [imageUrl, setImageUrl] = useState<string | null>(projectType.imageUrl || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens or projectType changes
  useEffect(() => {
    if (open) {
      setName(projectType.name);
      setSlug(projectType.slug);
      setImageUrl(projectType.imageUrl || null);
      setError(null);
    }
  }, [open, projectType]);

  const handleUpdate = async () => {
    if (!name.trim()) return setError("Name is required");
    if (!slug.trim()) return setError("Slug is required");

    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.patch(`/api/project-types/${projectType.id}`, {
        name,
        slug,
        imageUrl,
      });

      if (!data.success) throw new Error(data.message);
      toast.success("Project type updated successfully");

      onProjectTypeUpdated(data.data);
      setOpen(false);
    } catch (err: unknown) {
      let errorMsg = "Failed to update project type";

      if (err instanceof AxiosError) {
        errorMsg = err.response?.data?.message || errorMsg;
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }

      setError(errorMsg);
      toast.error(errorMsg);
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
    if (slug === generateSlug(projectType.name)) {
      setSlug(generateSlug(value));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="outline" className="cursor-pointer">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project Type</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="text-sm text-red-500 bg-red-50 border border-red-200 p-2 rounded">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="Enter project type name"
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

          <ImageUpload
            label="Project Type Image"
            value={imageUrl}
            onChange={setImageUrl}
            folder="project-types"
            helpText="Upload or replace the project type image"
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            disabled={loading}
            onClick={handleUpdate}
            className="cursor-pointer flex items-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
