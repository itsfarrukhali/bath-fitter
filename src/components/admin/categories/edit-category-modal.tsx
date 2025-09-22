// src/components/admin/categories/edit-category-modal.tsx
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Category, ShowerType } from "@/types/category";

interface Props {
  category: Category;
  onCategoryUpdated: (category: Category) => void;
}

export default function EditCategoryModal({
  category,
  onCategoryUpdated,
}: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(category.name);
  const [slug, setSlug] = useState(category.slug);
  const [hasSubcategories, setHasSubcategories] = useState(
    category.hasSubcategories
  );
  const [showerTypeId, setShowerTypeId] = useState<string>(
    category.showerTypeId.toString()
  );
  const [showerTypes, setShowerTypes] = useState<ShowerType[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingShowerTypes, setFetchingShowerTypes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch shower types when modal opens
  useEffect(() => {
    if (open) {
      fetchShowerTypes();
    }
  }, [open]);

  const fetchShowerTypes = async () => {
    setFetchingShowerTypes(true);
    try {
      const { data } = await axios.get("/api/shower-types");
      if (data.success) {
        setShowerTypes(data.data);
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to fetch shower types");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to fetch shower types");
      }
      toast.error("Failed to fetch shower types");
    } finally {
      setFetchingShowerTypes(false);
    }
  };

  const handleUpdate = async () => {
    if (!name.trim()) return setError("Category name is required");
    if (!slug.trim()) return setError("Slug is required");
    if (!showerTypeId) return setError("Shower type is required");

    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.put(`/api/categories/${category.id}`, {
        name,
        slug,
        hasSubcategories,
        showerTypeId: parseInt(showerTypeId),
      });

      if (!data.success) throw new Error(data.message);
      toast.success("Category updated successfully");

      onCategoryUpdated(data.data);
      setOpen(false);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to update category");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to update category");
      }
      toast.error("Failed to update category");
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
    if (slug === generateSlug(category.name)) {
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

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="text-sm text-red-500 bg-red-50 border border-red-200 p-2 rounded">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Category Name *</Label>
            <Input
              id="name"
              placeholder="Enter category name"
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
            <Label htmlFor="showerType">Shower Type *</Label>
            <Select
              value={showerTypeId}
              onValueChange={setShowerTypeId}
              disabled={fetchingShowerTypes}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select shower type" />
              </SelectTrigger>
              <SelectContent>
                {showerTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fetchingShowerTypes && (
              <p className="text-xs text-muted-foreground">
                Loading shower types...
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasSubcategories"
              checked={hasSubcategories}
              onCheckedChange={(checked) =>
                setHasSubcategories(checked === true)
              }
            />
            <Label htmlFor="hasSubcategories" className="cursor-pointer">
              This category has subcategories
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            className="mr-auto cursor-pointer"
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
