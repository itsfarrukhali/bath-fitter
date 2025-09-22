// src/components/admin/project-types/delete-project-type-modal.tsx
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
  projectTypeId: number;
  projectTypeName: string;
  onProjectTypeDeleted: (id: number) => void;
}

export default function DeleteProjectTypeModal({
  projectTypeId,
  projectTypeName,
  onProjectTypeDeleted,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.delete(
        `/api/project-types/${projectTypeId}`
      );

      if (!data.success) throw new Error(data.message);
      toast.success("Project type deleted successfully");

      onProjectTypeDeleted(projectTypeId);
      setOpen(false);
    } catch (err: unknown) {
      let errorMsg = "Failed to delete project type";

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer" size="icon" variant="destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Project Type</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm">
            Are you sure you want to delete the project type{" "}
            <span className="font-semibold">{projectTypeName}</span>? This
            action cannot be undone.
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
            className="cursor-pointer flex items-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
