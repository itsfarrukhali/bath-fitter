// src/components/admin/subcategories/create-subcategory-modal.tsx
"use client";

import { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import { Loader2, Plus, HelpCircle } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import type { Subcategory } from "@/types/subcategory";
import { Category } from "@/types/category";

interface Props {
  onSubcategoryCreated: (subcategory: Subcategory) => void;
}

// Common z-index examples for subcategories
const Z_INDEX_EXAMPLES = [
  { name: "Shelves", value: 31 },
  { name: "Soap Dishes", value: 32 },
  { name: "Seats", value: 35 },
  { name: "Grab Bars", value: 40 },
  { name: "Doors", value: 42 },
  { name: "Rods", value: 43 },
];

export default function CreateSubcategoryModal({
  onSubcategoryCreated,
}: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [zIndex, setZIndex] = useState<number | "">(50); // Default to 50
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
    if (zIndex === "" || zIndex < 0 || zIndex > 100) {
      return setError("Z-Index must be a number between 0 and 100");
    }

    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.post("/api/subcategories", {
        name,
        slug,
        categoryId: parseInt(categoryId),
        z_index: zIndex === 0 ? null : zIndex,
      });

      if (!data.success) throw new Error(data.message);
      toast.success("Subcategory created successfully");

      onSubcategoryCreated(data.data);
      setName("");
      setSlug("");
      setCategoryId("");
      setZIndex(50);
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
                    <p className="text-xs text-muted-foreground">
                      Examples: Shelves (31), Soap Dishes (32), Seats (35), Grab
                      Bars (40), Doors (42), Rods (43)
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="z_index"
              type="number"
              min="0"
              max="100"
              placeholder="50"
              value={zIndex}
              onChange={(e) => handleZIndexChange(e.target.value)}
            />
            <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
              <span>Common values:</span>
              {Z_INDEX_EXAMPLES.map((example, index) => (
                <span key={example.name} className="flex items-center">
                  {example.name} ({example.value})
                  {index < Z_INDEX_EXAMPLES.length - 1 && <span>,</span>}
                </span>
              ))}
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
