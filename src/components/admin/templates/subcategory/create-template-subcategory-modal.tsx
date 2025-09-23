// app/templates/[slug]/create-template-subcategory-modal.tsx
"use client";
import { useState, useEffect } from "react"; // Add useEffect
import axios, { AxiosError } from "axios";
import { Loader2, FolderTree } from "lucide-react";
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
import { toast } from "sonner";
import generateSlug from "@/utils/generateSlug";

interface Props {
  templateCategoryId: number;
  onSubcategoryCreated: () => void;
}

export default function CreateTemplateSubcategoryModal({
  templateCategoryId,
  onSubcategoryCreated,
}: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-generate slug when name changes
  useEffect(() => {
    if (name.trim()) {
      setSlug(generateSlug(name));
    } else {
      setSlug(""); // Clear slug if name is empty
    }
  }, [name]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Subcategory name is required");
      return;
    }
    if (!slug.trim()) {
      toast.error("Slug is required");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post("/api/template-subcategories", {
        name,
        slug,
        description,
        templateCategoryId,
      });

      if (data.success) {
        toast.success("Template subcategory created successfully");
        onSubcategoryCreated();
        setName("");
        setSlug("");
        setDescription("");
        setOpen(false);
      } else {
        toast.error(data.message || "Failed to create template subcategory");
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(
          err.response?.data?.message || "Failed to create template subcategory"
        );
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <FolderTree className="h-4 w-4 mr-2" />
          Add Subcategory
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Template Subcategory</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter subcategory name"
            />
          </div>
          <div>
            <Label>Slug</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="Auto-generated from name"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
