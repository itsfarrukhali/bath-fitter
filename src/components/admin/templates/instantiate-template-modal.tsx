// src/components/admin/templates/instantiate-template-modal.tsx
"use client";

import { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import { Loader2, Copy, ShowerHead } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ShowerType {
  id: number;
  name: string;
  slug: string;
}

interface InstantiationResult {
  showerTypeId: number;
  success: boolean;
  message?: string;
  categoryId?: number;
}

interface Props {
  templateId: number;
  templateName: string;
  onInstantiated: () => void;
}

export default function InstantiateTemplateModal({
  templateId,
  templateName,
  onInstantiated,
}: Props) {
  const [open, setOpen] = useState(false);
  const [showerTypes, setShowerTypes] = useState<ShowerType[]>([]);
  const [selectedShowerTypes, setSelectedShowerTypes] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingShowerTypes, setFetchingShowerTypes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchShowerTypes();
    }
  }, [open]);

  const fetchShowerTypes = async () => {
    setFetchingShowerTypes(true);
    try {
      const { data } = await axios.get("/api/shower-types?limit=100");
      if (data.success) {
        setShowerTypes(data.data);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch shower types:", err);
    } finally {
      setFetchingShowerTypes(false);
    }
  };

  const handleInstantiate = async () => {
    if (selectedShowerTypes.length === 0) {
      return setError("Please select at least one shower type");
    }

    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.post("/api/templates/instantiate", {
        templateCategoryId: templateId,
        showerTypeIds: selectedShowerTypes,
      });

      if (!data.success) throw new Error(data.message);

      const successCount = data.data.filter(
        (result: InstantiationResult) => result.success
      ).length;
      toast.success(
        `Template instantiated to ${successCount} shower types successfully`
      );

      onInstantiated();
      setSelectedShowerTypes([]);
      setOpen(false);
    } catch (err: unknown) {
      let errorMsg = "Failed to instantiate template";

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

  const toggleShowerType = (showerTypeId: number) => {
    setSelectedShowerTypes((prev) =>
      prev.includes(showerTypeId)
        ? prev.filter((id) => id !== showerTypeId)
        : [...prev, showerTypeId]
    );
  };

  const selectAll = () => {
    setSelectedShowerTypes(showerTypes.map((st) => st.id));
  };

  const selectNone = () => {
    setSelectedShowerTypes([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="cursor-pointer">
          <Copy className="h-4 w-4 mr-2" />
          Instantiate
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Instantiate Template</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="text-sm text-red-500 bg-red-50 border border-red-200 p-2 rounded">
              {error}
            </div>
          )}

          <p className="text-sm">
            Create instances of{" "}
            <span className="font-semibold">{templateName}</span> in selected
            shower types:
          </p>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Select Shower Types</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={selectNone}>
                  Select None
                </Button>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto border rounded-md p-2">
              {fetchingShowerTypes ? (
                <div className="text-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Loading shower types...
                  </p>
                </div>
              ) : (
                showerTypes.map((showerType) => (
                  <div
                    key={showerType.id}
                    className="flex items-center space-x-2 py-2"
                  >
                    <Checkbox
                      id={`shower-type-${showerType.id}`}
                      checked={selectedShowerTypes.includes(showerType.id)}
                      onCheckedChange={() => toggleShowerType(showerType.id)}
                    />
                    <Label
                      htmlFor={`shower-type-${showerType.id}`}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <ShowerHead className="h-4 w-4" />
                      {showerType.name}
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>
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
            disabled={loading || selectedShowerTypes.length === 0}
            onClick={handleInstantiate}
            className="flex items-center gap-2 cursor-pointer"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Instantiate to {selectedShowerTypes.length} Shower Types
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
