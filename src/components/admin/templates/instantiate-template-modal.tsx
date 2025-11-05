// src/components/admin/templates/instantiate-template-modal.tsx
"use client";

import { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import { Loader2, Copy, ShowerHead, Settings } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  PlumbingOptions,
  PlumbingConfig,
  InstantiationProgress,
} from "@/types/template";

interface ShowerType {
  id: number;
  name: string;
  slug: string;
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

  const [plumbingOptions, setPlumbingOptions] = useState<PlumbingOptions>({
    createForLeft: true,
    createForRight: false,
    mirrorImages: true,
  });

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
      toast.error("Failed to load shower types");
    } finally {
      setFetchingShowerTypes(false);
    }
  };

  const handleInstantiate = async () => {
    if (selectedShowerTypes.length === 0) {
      toast.error("Please select at least one shower type");
      return;
    }

    if (!plumbingOptions.createForLeft && !plumbingOptions.createForRight) {
      toast.error("Please select at least one plumbing configuration");
      return;
    }

    setLoading(true);

    try {
      const { data } = await axios.post("/api/templates/instantiate", {
        templateCategoryId: templateId,
        showerTypeIds: selectedShowerTypes,
        plumbingOptions,
      });

      if (!data.success) throw new Error(data.message);

      // Create progress tracking task
      const taskId = `instantiate-${templateId}-${Date.now()}`;
      const selectedShowerTypeNames = showerTypes
        .filter((st) => selectedShowerTypes.includes(st.id))
        .reduce((acc, st) => {
          if (plumbingOptions.createForLeft) {
            acc.push({
              showerTypeId: st.id,
              showerTypeName: st.name,
              plumbingConfig: PlumbingConfig.LEFT,
              status: "pending" as const,
            });
          }
          if (plumbingOptions.createForRight) {
            acc.push({
              showerTypeId: st.id,
              showerTypeName: st.name,
              plumbingConfig: PlumbingConfig.RIGHT,
              status: "pending" as const,
            });
          }
          return acc;
        }, [] as InstantiationProgress[]);

      // Show progress toast
      const toastId = toast.loading(
        <InstantiationProgressToast
          taskId={taskId}
          templateName={templateName}
          progress={selectedShowerTypeNames}
          total={selectedShowerTypeNames.length}
          completed={0}
        />,
        {
          duration: Infinity,
        }
      );

      // Close modal immediately
      setOpen(false);
      setSelectedShowerTypes([]);

      // Start background processing
      processInstantiation(taskId, data.data, toastId);
    } catch (err: unknown) {
      let errorMsg = "Failed to start template instantiation";

      if (err instanceof AxiosError) {
        errorMsg = err.response?.data?.message || errorMsg;
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }

      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const processInstantiation = async (
    taskId: string,
    results: any[],
    toastId: string | number
  ) => {
    let completed = 0;
    const total = results.length;

    // Update progress for each result
    results.forEach((result, index) => {
      setTimeout(() => {
        completed++;
        const success = result.success;

        toast.loading(
          <InstantiationProgressToast
            taskId={taskId}
            templateName={templateName}
            progress={results.slice(0, index + 1).map((r) => ({
              showerTypeId: r.showerTypeId,
              showerTypeName:
                showerTypes.find((st) => st.id === r.showerTypeId)?.name ||
                "Unknown",
              plumbingConfig: r.plumbingConfig,
              status: r.success ? "success" : "error",
              message: r.message,
              categoryId: r.categoryId,
            }))}
            total={total}
            completed={completed}
          />,
          {
            duration: completed === total ? 5000 : Infinity,
            id: toastId,
          }
        );

        if (completed === total) {
          const successCount = results.filter((r) => r.success).length;
          const errorCount = results.filter((r) => !r.success).length;

          if (errorCount === 0) {
            toast.success(
              `Template instantiated successfully to ${successCount} configurations!`,
              { id: toastId }
            );
          } else {
            toast.warning(
              `Instantiation completed with ${successCount} successes and ${errorCount} errors`,
              { id: toastId }
            );
          }

          // Refresh templates list
          onInstantiated();
        }
      }, index * 100); // Stagger updates for better UX
    });
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

  const getSelectedCount = () => {
    let count = 0;
    if (plumbingOptions.createForLeft) count += selectedShowerTypes.length;
    if (plumbingOptions.createForRight) count += selectedShowerTypes.length;
    return count;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="cursor-pointer">
          <Copy className="h-4 w-4 mr-2" />
          Instantiate
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Instantiate Template</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Template: {templateName}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              This will create instances of the template in selected shower
              types with your preferred plumbing configurations.
            </CardContent>
          </Card>

          {/* Plumbing Configuration */}
          <div className="space-y-4">
            <Label className="text-base font-medium">
              Plumbing Configuration
            </Label>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="createForLeft"
                    checked={plumbingOptions.createForLeft}
                    onCheckedChange={(checked) =>
                      setPlumbingOptions((prev) => ({
                        ...prev,
                        createForLeft: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor="createForLeft" className="cursor-pointer">
                    Left Plumbing
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">
                  Create instances for left-handed plumbing
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="createForRight"
                    checked={plumbingOptions.createForRight}
                    onCheckedChange={(checked) =>
                      setPlumbingOptions((prev) => ({
                        ...prev,
                        createForRight: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor="createForRight" className="cursor-pointer">
                    Right Plumbing
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">
                  Create instances for right-handed plumbing
                </p>
              </div>
            </div>

            {plumbingOptions.createForLeft &&
              plumbingOptions.createForRight && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="mirrorImages"
                      checked={plumbingOptions.mirrorImages}
                      onCheckedChange={(checked) =>
                        setPlumbingOptions((prev) => ({
                          ...prev,
                          mirrorImages: checked as boolean,
                        }))
                      }
                    />
                    <Label
                      htmlFor="mirrorImages"
                      className="cursor-pointer font-medium"
                    >
                      Automatically mirror images between plumbing types
                    </Label>
                  </div>
                  <p className="text-xs text-blue-600 mt-2 ml-6">
                    When enabled: Images will be automatically mirrored between
                    left and right plumbing configurations. This saves you from
                    uploading duplicate images manually.
                  </p>
                </div>
              )}
          </div>

          {/* Shower Type Selection */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-base font-medium">
                Select Shower Types
              </Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={selectNone}>
                  Select None
                </Button>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto border rounded-md p-4 space-y-2">
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
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50"
                  >
                    <Checkbox
                      id={`shower-type-${showerType.id}`}
                      checked={selectedShowerTypes.includes(showerType.id)}
                      onCheckedChange={() => toggleShowerType(showerType.id)}
                    />
                    <Label
                      htmlFor={`shower-type-${showerType.id}`}
                      className="flex items-center gap-2 cursor-pointer flex-1"
                    >
                      <ShowerHead className="h-4 w-4" />
                      {showerType.name}
                    </Label>
                    {selectedShowerTypes.includes(showerType.id) && (
                      <Badge variant="secondary" className="text-xs">
                        {plumbingOptions.createForLeft &&
                        plumbingOptions.createForRight
                          ? "Both"
                          : plumbingOptions.createForLeft
                          ? "Left"
                          : "Right"}
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Summary */}
          {selectedShowerTypes.length > 0 && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Instantiation Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Selected shower types:</span>
                    <span className="font-medium">
                      {selectedShowerTypes.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Plumbing configurations:</span>
                    <span className="font-medium">
                      {[
                        plumbingOptions.createForLeft && "Left",
                        plumbingOptions.createForRight && "Right",
                      ]
                        .filter(Boolean)
                        .join(" + ")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total instances to create:</span>
                    <span className="font-medium text-primary">
                      {getSelectedCount()}
                    </span>
                  </div>
                  {plumbingOptions.mirrorImages && (
                    <div className="flex justify-between text-green-600">
                      <span>Image mirroring:</span>
                      <span className="font-medium">Enabled</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
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
            disabled={
              loading ||
              selectedShowerTypes.length === 0 ||
              getSelectedCount() === 0
            }
            onClick={handleInstantiate}
            className="flex items-center gap-2 cursor-pointer"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Instantiate {getSelectedCount() > 0 && `(${getSelectedCount()})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Progress Toast Component
function InstantiationProgressToast({
  taskId,
  templateName,
  progress,
  total,
  completed,
}: {
  taskId: string;
  templateName: string;
  progress: InstantiationProgress[];
  total: number;
  completed: number;
}) {
  const isComplete = completed === total;
  const successCount = progress.filter((p) => p.status === "success").length;
  const errorCount = progress.filter((p) => p.status === "error").length;

  return (
    <div className="w-80 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium">Instantiating Template</p>
          <p className="text-sm text-muted-foreground">{templateName}</p>
        </div>
        <Badge
          variant={
            isComplete
              ? errorCount === 0
                ? "default"
                : "destructive"
              : "secondary"
          }
        >
          {completed}/{total}
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${(completed / total) * 100}%` }}
        />
      </div>

      {/* Progress Items */}
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {progress.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  item.status === "success"
                    ? "bg-green-500"
                    : item.status === "error"
                    ? "bg-red-500"
                    : item.status === "processing"
                    ? "bg-blue-500 animate-pulse"
                    : "bg-gray-300"
                }`}
              />
              <span className="font-medium">{item.showerTypeName}</span>
              <Badge variant="outline" className="text-xs">
                {item.plumbingConfig.toLowerCase()}
              </Badge>
            </div>
            <span
              className={`text-xs ${
                item.status === "success"
                  ? "text-green-600"
                  : item.status === "error"
                  ? "text-red-600"
                  : "text-muted-foreground"
              }`}
            >
              {item.status === "success"
                ? "✓"
                : item.status === "error"
                ? "✗"
                : item.status === "processing"
                ? "⟳"
                : "⋯"}
            </span>
          </div>
        ))}
      </div>

      {/* Summary */}
      {isComplete && (
        <div
          className={`text-sm ${
            errorCount === 0 ? "text-green-600" : "text-amber-600"
          }`}
        >
          {errorCount === 0
            ? `✅ Successfully created ${successCount} instances`
            : `⚠️ Completed with ${successCount} successes and ${errorCount} errors`}
        </div>
      )}
    </div>
  );
}
