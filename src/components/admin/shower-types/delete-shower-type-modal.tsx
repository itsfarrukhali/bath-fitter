// src/components/admin/shower-types/delete-shower-type-modal.tsx
"use client";

import { useState } from "react";
import axios, { AxiosError } from "axios";
import { Loader2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  showerTypeId: number;
  showerTypeName: string;
  onShowerTypeDeleted: (id: number) => void;
}

export default function DeleteShowerTypeModal({
  showerTypeId,
  showerTypeName,
  onShowerTypeDeleted,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.delete(`/api/shower-types/${showerTypeId}`);

      if (!data.success) throw new Error(data.message);
      toast.success("Shower type deleted successfully");

      onShowerTypeDeleted(showerTypeId);
      setOpen(false);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to delete shower type");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to fetch shower types");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer" size="icon" variant="destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Shower Type</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm">
            Are you sure you want to delete the shower type{" "}
            <span className="font-semibold">{showerTypeName}</span>? This action
            cannot be undone.
          </p>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 border border-red-200 p-2 rounded">
              {error}
            </div>
          )}
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
            variant="destructive"
            disabled={loading}
            onClick={handleDelete}
            className="flex items-center gap-2 cursor-pointer"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
