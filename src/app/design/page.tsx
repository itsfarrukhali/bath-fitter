"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  Save,
  Loader2,
  Smartphone,
  Monitor,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Move,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ConfiguratorState,
  Category,
  Product,
  ProductVariant,
  Subcategory,
} from "@/types/design";
import DesktopConfigurator from "@/components/design/desktop-configurator";
import MobileConfigurator from "@/components/design/mobile-configurator";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { transformCloudinaryUrl } from "@/utils/cloudinaryTransform";
import { getProductImageUrl } from "@/utils/productImageHelper";
import {
  getAppropriateVariant,
  getVariantForPlumbingConfig,
} from "@/utils/plumbingProductHelper";

interface Position {
  x: number;
  y: number;
}

// Utility functions for localStorage
const storageUtils = {
  // Get current designs array
  getCurrentDesigns: (): string[] => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("currentDesigns") || "[]");
    } catch {
      return [];
    }
  },

  // Save design with proper error handling
  saveDesign: (designId: string, state: ConfiguratorState): boolean => {
    try {
      if (typeof window === "undefined") return false;

      // Save design data
      localStorage.setItem(designId, JSON.stringify(state));

      // Update current designs array
      const currentDesigns = storageUtils.getCurrentDesigns();
      if (!currentDesigns.includes(designId)) {
        currentDesigns.push(designId);
        localStorage.setItem("currentDesigns", JSON.stringify(currentDesigns));
      }

      return true;
    } catch (error) {
      console.error("Error saving design:", error);
      return false;
    }
  },

  // Cleanup old designs (keep only last 10)
  cleanupOldDesigns: () => {
    try {
      const currentDesigns = storageUtils.getCurrentDesigns();
      if (currentDesigns.length > 10) {
        const designsToRemove = currentDesigns.slice(
          0,
          currentDesigns.length - 10
        );
        designsToRemove.forEach((designId) => {
          localStorage.removeItem(designId);
        });
        localStorage.setItem(
          "currentDesigns",
          JSON.stringify(currentDesigns.slice(-10))
        );
      }
    } catch (error) {
      console.error("Error cleaning up designs:", error);
    }
  },
};

export default function DesignPage() {
  const router = useRouter();
  const [state, setState] = useState<ConfiguratorState>({
    configuration: {},
    categories: [],
    selectedCategory: null,
    selectedSubcategory: null,
    selectedProducts: {},
    baseImage: "/images/shower-base-main.png",
  });
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [imageLoading, setImageLoading] = useState(true);

  const checkViewport = useCallback(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  const loadConfiguration = useCallback(async () => {
    try {
      setLoading(true);

      const config = sessionStorage.getItem("showerConfig");
      if (!config) {
        toast.error("No configuration found. Please start over.");
        router.push("/project-type");
        return;
      }

      const configuration = JSON.parse(config);

      const categoriesResponse = await axios.get(
        `/api/categories?showerTypeId=${configuration.showerTypeId}&includeProducts=true&plumbingConfig=${configuration.plumbingConfig}`
      );

      if (categoriesResponse.status !== 200) {
        throw new Error("Failed to fetch categories");
      }

      const categoriesData = categoriesResponse.data;

      if (!categoriesData.success) throw new Error(categoriesData.message);

      setState((prev) => ({
        ...prev,
        configuration,
        categories: categoriesData.data,
        plumbingConfig: configuration.plumbingConfig,
        baseImage: getBaseImage(
          configuration.showerTypeId,
          configuration.plumbingConfig
        ),
      }));
    } catch (error) {
      console.error("Error loading configuration:", error);
      toast.error("Failed to load design configuration");

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          toast.error("Configuration data not found");
        } else if (error.response && error.response.status >= 500) {
          toast.error("Server error. Please try again later.");
        } else {
          toast.error("An unexpected error occurred. Please try again.");
        }
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleBaseImageLoad = () => {
    setImageLoading(false);
  };

  const handleBaseImageError = () => {
    setImageLoading(false);
    toast.error("Failed to load base image");
  };

  useEffect(() => {
    loadConfiguration();
    checkViewport();
    window.addEventListener("resize", checkViewport);

    // Cleanup on component unmount
    return () => {
      window.removeEventListener("resize", checkViewport);
    };
  }, [loadConfiguration, checkViewport]);

  const getBaseImage = (showerTypeId: number, plumbingConfig?: string) => {
    const showerTypeMap: { [key: number]: string } = {
      5: "tub-to-shower",
      6: "curved",
      7: "neo-angle",
      8: "alcove",
    };

    const showerType = showerTypeMap[showerTypeId] || "main";
    const plumbing = plumbingConfig || "right";

    // For local images, we have separate files
    // For Cloudinary images, we use transformations
    return `/images/shower-base-main-${showerType}-${plumbing}.png`;
  };

  const handleCategorySelect = (category: Category) => {
    setState((prev) => ({
      ...prev,
      selectedCategory: category,
      selectedSubcategory: null,
    }));
  };

  const handleSubcategorySelect = (subcategory: Subcategory | null) => {
    setState((prev) => ({ ...prev, selectedSubcategory: subcategory }));
  };

  const handleProductSelect = (product: Product, variant?: ProductVariant) => {
    if (!product) return;

    console.log("Product:", product.name);
    console.log("Product variants:", product.variants);
    console.log("Shower Type:", state.configuration.showerTypeId);
    console.log("Plumbing Config:", state.configuration.plumbingConfig);

    // Use enhanced plumbing-aware variant selection
    const plumbingConfig = state.configuration.plumbingConfig ?? "right";
    const showerTypeId = state.configuration.showerTypeId ?? 5;

    const selectedVariant = getAppropriateVariant(
      product,
      plumbingConfig,
      showerTypeId
    );

    console.log("Selected variant:", selectedVariant);
    console.log("Variant plumbing config:", selectedVariant?.plumbing_config);

    const productImageUrl = getProductImageUrl(product, selectedVariant);

    const productKey = product.subcategoryId
      ? `subcategory-${product.subcategoryId}`
      : `category-${product.categoryId}`;

    setState((prev) => {
      const newSelectedProducts = { ...prev.selectedProducts };

      // Door/Rod detection logic (unchanged)
      const isDoorOrRod = () => {
        const categorySlug = product.category?.slug?.toLowerCase();
        const subcategorySlug = product.subcategory?.slug?.toLowerCase();
        const productName = product.name?.toLowerCase();
        const productSlug = product.slug?.toLowerCase();

        if (categorySlug === "doors" || categorySlug === "rods") return true;
        if (subcategorySlug === "doors" || subcategorySlug === "rods")
          return true;
        if (productName?.includes("door") || productSlug?.includes("door"))
          return true;
        if (productName?.includes("rod") || productSlug?.includes("rod"))
          return true;

        return false;
      };

      // If it's a door or rod, remove any existing door or rod
      if (isDoorOrRod()) {
        Object.keys(newSelectedProducts).forEach((key) => {
          const selected = newSelectedProducts[key];
          if (!selected || !selected.product) {
            delete newSelectedProducts[key];
            return;
          }

          const existingProduct = selected.product;
          const existingCategorySlug =
            existingProduct.category?.slug?.toLowerCase();
          const existingSubcategorySlug =
            existingProduct.subcategory?.slug?.toLowerCase();
          const existingProductName = existingProduct.name?.toLowerCase();
          const existingProductSlug = existingProduct.slug?.toLowerCase();

          const isExistingDoorOrRod =
            existingCategorySlug === "doors" ||
            existingCategorySlug === "rods" ||
            existingSubcategorySlug === "doors" ||
            existingSubcategorySlug === "rods" ||
            existingProductName?.includes("door") ||
            existingProductSlug?.includes("door") ||
            existingProductName?.includes("rod") ||
            existingProductSlug?.includes("rod");

          if (isExistingDoorOrRod) {
            delete newSelectedProducts[key];
          }
        });
      }

      return {
        ...prev,
        selectedProducts: {
          ...newSelectedProducts,
          [productKey]: {
            product: {
              ...product,
              imageUrl: productImageUrl,
            },
            variant: selectedVariant
              ? {
                  ...selectedVariant,
                  imageUrl: selectedVariant.imageUrl || productImageUrl,
                }
              : undefined,
            categoryId: product.categoryId,
            subcategoryId: product.subcategoryId,
          },
        },
      };
    });

    toast.success(`${product.name} applied to design`);
  };

  const handleVariantSelect = (variant: ProductVariant, product: Product) => {
    const productKey = product.subcategoryId
      ? `subcategory-${product.subcategoryId}`
      : `category-${product.categoryId}`;

    setState((prev) => ({
      ...prev,
      selectedProducts: {
        ...prev.selectedProducts,
        [productKey]: {
          ...prev.selectedProducts[productKey],
          variant,
        },
      },
    }));
  };

  const handleRemoveProduct = (productKey: string) => {
    setState((prev) => {
      const newSelectedProducts = { ...prev.selectedProducts };
      delete newSelectedProducts[productKey];
      return {
        ...prev,
        selectedProducts: newSelectedProducts,
      };
    });
    toast.success("Product removed from design");
  };

  const handleSaveDesign = () => {
    try {
      const designData = {
        configuration: state.configuration,
        selectedProducts: state.selectedProducts,
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem("savedDesign", JSON.stringify(designData));
      toast.success("Design saved successfully!");
    } catch (error) {
      console.error("Error saving design:", error);
      toast.error("Failed to save design. Please try again.");
    }
  };

  // IMPROVED PRINT FUNCTION
  const handlePrint = () => {
    try {
      // Generate unique ID for this design session
      const designId = `design-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Save design with proper error handling
      const success = storageUtils.saveDesign(designId, state);

      if (!success) {
        toast.error("Failed to prepare design for printing");
        return;
      }

      // Cleanup old designs
      storageUtils.cleanupOldDesigns();

      // Debug: Log current designs
      console.log(
        "Current designs after save:",
        storageUtils.getCurrentDesigns()
      );
      console.log("Design saved with ID:", designId);

      // Open print page with design ID
      const printWindow = window.open(
        `/design/print?designId=${designId}`,
        "_blank"
      );

      if (!printWindow) {
        toast.error("Please allow popups for printing");
        return;
      }
    } catch (error) {
      console.error("Error in handlePrint:", error);
      toast.error("Failed to open print preview");
    }
  };

  // Zoom and drag handlers (unchanged)
  const handleZoomIn = () => {
    setZoomLevel((prev) => {
      const newZoom = Math.min(prev + 0.25, 5);
      if (newZoom === 1) setPosition({ x: 0, y: 0 });
      return newZoom;
    });
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const newZoom = Math.max(prev - 0.25, 0.5);
      if (newZoom === 1) setPosition({ x: 0, y: 0 });
      return newZoom;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
      e.preventDefault();
    }
  };

  const calculateDragBounds = (zoom: number) => {
    const scale = zoom - 1;
    const bound = 300 * scale;
    return {
      minX: -bound,
      maxX: bound,
      minY: -bound,
      maxY: bound,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    const bounds = calculateDragBounds(zoomLevel);

    setPosition({
      x: Math.max(Math.min(newX, bounds.maxX), bounds.minX),
      y: Math.max(Math.min(newY, bounds.maxY), bounds.minY),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="text-center space-y-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <div className="absolute inset-0 h-12 w-12 mx-auto rounded-full bg-primary/20 animate-ping" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium">Loading your design...</p>
            <p className="text-sm text-muted-foreground">
              Preparing the perfect canvas
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/90 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-3 py-3">
          {/* Mobile Layout */}
          <div className="md:hidden flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/plumbing-config")}
                  className="flex items-center gap-1 hover:bg-muted/80 transition-colors cursor-pointer shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Sparkles className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h1 className="text-base font-bold truncate">
                      Design Your Shower
                    </h1>
                    {state.configuration.showerTypeName && (
                      <p className="text-xs text-muted-foreground truncate">
                        {state.configuration.showerTypeName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSaveDesign}
                  className="h-9 w-9 p-0 cursor-pointer"
                  title="Save"
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrint}
                  className="h-9 w-9 p-0 cursor-pointer"
                  title="Print"
                >
                  <Printer className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 border rounded-lg p-1 bg-background">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomOut}
                  className="h-7 w-7 p-0 cursor-pointer"
                  disabled={zoomLevel <= 0.5}
                >
                  <ZoomOut className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetZoom}
                  className="h-7 px-2 text-xs cursor-pointer"
                >
                  {Math.round(zoomLevel * 100)}%
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomIn}
                  className="h-7 w-7 p-0 cursor-pointer"
                  disabled={zoomLevel >= 5}
                >
                  <ZoomIn className="h-3 w-3" />
                </Button>
              </div>
              <Badge variant="outline" className="text-xs">
                {isMobile ? "Mobile" : "Desktop"} View
              </Badge>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/plumbing-config")}
                className="flex items-center gap-2 hover:bg-muted/80 transition-colors cursor-pointer shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex items-center gap-2 shrink-0">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Design Your Shower
                  </h1>
                </div>
                {state.configuration.showerTypeName && (
                  <div className="hidden lg:block flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground truncate">
                      {state.configuration.showerTypeName} •{" "}
                      {state.configuration.plumbingConfig} Plumbing
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1 border rounded-lg p-1 bg-background">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomOut}
                  className="h-8 w-8 p-0 cursor-pointer"
                  disabled={zoomLevel <= 0.5}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetZoom}
                  className="h-8 px-2 text-xs cursor-pointer"
                >
                  {Math.round(zoomLevel * 100)}%
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomIn}
                  className="h-8 w-8 p-0 cursor-pointer"
                  disabled={zoomLevel >= 5}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 cursor-pointer"
                  title="Click and drag to pan when zoomed in"
                >
                  <Move className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="hidden lg:flex items-center gap-2 hover:bg-muted/80 transition-colors cursor-pointer"
              >
                {isMobile ? (
                  <Smartphone className="h-4 w-4" />
                ) : (
                  <Monitor className="h-4 w-4" />
                )}
                <span>{isMobile ? "Mobile" : "Desktop"} View</span>
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveDesign}
                  className="hover:bg-muted/80 transition-colors cursor-pointer"
                >
                  <Save className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Save</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="hover:bg-muted/80 transition-colors cursor-pointer"
                >
                  <Printer className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Print</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-2 sm:p-4">
        {isMobile ? (
          <MobileConfigurator
            state={state}
            onCategorySelect={handleCategorySelect}
            onSubcategorySelect={handleSubcategorySelect}
            onProductSelect={handleProductSelect}
            onVariantSelect={handleVariantSelect}
            onRemoveProduct={handleRemoveProduct}
            zoomLevel={zoomLevel}
            position={position}
            isDragging={isDragging}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetZoom={handleResetZoom}
            onImageLoad={handleBaseImageLoad}
            onImageError={handleBaseImageError}
            imageLoading={imageLoading}
          />
        ) : (
          <DesktopConfigurator
            state={state}
            onCategorySelect={handleCategorySelect}
            onSubcategorySelect={handleSubcategorySelect}
            onProductSelect={handleProductSelect}
            onVariantSelect={handleVariantSelect}
            onRemoveProduct={handleRemoveProduct}
            zoomLevel={zoomLevel}
            position={position}
            isDragging={isDragging}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onImageLoad={handleBaseImageLoad}
            onImageError={handleBaseImageError}
            imageLoading={imageLoading}
          />
        )}
      </div>
    </div>
  );
}
