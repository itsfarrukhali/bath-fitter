// src/components/admin/subcategories/create-subcategory-modal.tsx
"use client";

import { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import { Loader2, Plus } from "lucide-react";
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
import type { Subcategory } from "@/types/subcategory";
import { Category } from "@/types/category";

interface Props {
  onSubcategoryCreated: (subcategory: Subcategory) => void;
}

export default function CreateSubcategoryModal({
  onSubcategoryCreated,
}: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCategories, setFetchingCategories] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const fetchCategories = async () => {
    setFetchingCategories(true);
    try {
      const { data } = await axios.get(
        "/api/categories?forAdmin=true&limit=1000"
      );
      if (data.success) {
        const showerTypes = data.data.map((category: Category) => ({
          ...category,
          showerType: category.showerType || { name: "Unknown Shower Type" },
        }));
        setCategories(showerTypes);
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to fetch categories");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to fetch categories");
      }
      toast.error("Failed to fetch categories");
    } finally {
      setFetchingCategories(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) return setError("Name is required");
    if (!slug.trim()) return setError("Slug is required");
    if (!categoryId) return setError("Category is required");

    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.post("/api/subcategories", {
        name,
        slug,
        categoryId: parseInt(categoryId),
      });

      if (!data.success) throw new Error(data.message);
      toast.success("Subcategory created successfully");

      onSubcategoryCreated(data.data);
      setName("");
      setSlug("");
      setCategoryId("");
      setOpen(false);
    } catch (err: unknown) {
      let errorMsg = "Failed to create subcategory";

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
    if (!slug) {
      setSlug(generateSlug(value));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          Add Subcategory
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Subcategory</DialogTitle>
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
              placeholder="Enter subcategory name"
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
            <Label htmlFor="category">Category *</Label>
            <Select
              value={categoryId}
              onValueChange={setCategoryId}
              disabled={fetchingCategories}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name} ({category.showerType.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fetchingCategories && (
              <p className="text-xs text-muted-foreground">
                Loading categories...
              </p>
            )}
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
            onClick={handleSubmit}
            className="flex items-center gap-2 cursor-pointer"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
