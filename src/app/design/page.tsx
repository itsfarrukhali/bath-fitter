// app/design/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Printer,
  Save,
  Loader2,
  Smartphone,
  Monitor,
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

export default function DesignPage() {
  const router = useRouter();
  const [state, setState] = useState<ConfiguratorState>({
    configuration: {},
    categories: [],
    selectedCategory: null,
    selectedSubcategory: null,
    selectedProducts: {},
    baseImage: "/images/shower-base-main.png", // Default base image
  });
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    loadConfiguration();
    checkViewport();
    window.addEventListener("resize", checkViewport);

    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  const checkViewport = () => {
    setIsMobile(window.innerWidth < 768);
  };

  const loadConfiguration = async () => {
    try {
      setLoading(true);

      const config = sessionStorage.getItem("showerConfig");
      if (!config) {
        toast.error("No configuration found. Please start over.");
        router.push("/project-type");
        return;
      }

      const configuration = JSON.parse(config);

      // Fetch categories with products
      const categoriesResponse = await fetch(
        `/api/categories?showerTypeId=${configuration.showerTypeId}&includeProducts=true`
      );

      if (!categoriesResponse.ok) throw new Error("Failed to fetch categories");

      const categoriesData = await categoriesResponse.json();

      if (!categoriesData.success) throw new Error(categoriesData.message);

      setState((prev) => ({
        ...prev,
        configuration,
        categories: categoriesData.data,
        baseImage: getBaseImage(
          configuration.showerTypeId,
          configuration.plumbingConfig
        ),
      }));
    } catch (error) {
      console.error("Error loading configuration:", error);
      toast.error("Failed to load design configuration");
    } finally {
      setLoading(false);
    }
  };

  const getBaseImage = (showerTypeId: number, plumbingConfig?: string) => {
    const showerTypeMap: { [key: number]: string } = {
      1: "tub",
      2: "curved",
      3: "alcove",
      4: "neo-angle",
      5: "tub-to-shower",
    };

    const showerType = showerTypeMap[showerTypeId] || "main";
    const plumbing = plumbingConfig || "right";

    return `/images/shower-base-main-${showerType}-${plumbing}.png`;
  };

  const handleCategorySelect = (category: Category) => {
    setState((prev) => ({
      ...prev,
      selectedCategory: category,
      selectedSubcategory: category.hasSubcategories
        ? null
        : prev.selectedSubcategory,
    }));
  };

  const handleSubcategorySelect = (subcategory: Subcategory) => {
    setState((prev) => ({ ...prev, selectedSubcategory: subcategory }));
  };

  const handleProductSelect = (product: Product, variant?: ProductVariant) => {
    // Auto-select first variant if none provided
    const selectedVariant = variant || product.variants?.[0];

    // Create a unique key for this product category/subcategory combination
    // This ensures only one product per category/subcategory can be selected
    const productKey = product.subcategoryId
      ? `subcategory-${product.subcategoryId}`
      : `category-${product.categoryId}`;

    setState((prev) => ({
      ...prev,
      selectedProducts: {
        ...prev.selectedProducts,
        [productKey]: {
          product,
          variant: selectedVariant,
          categoryId: product.categoryId,
          subcategoryId: product.subcategoryId,
        },
      },
    }));

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
    const designData = {
      configuration: state.configuration,
      selectedProducts: state.selectedProducts,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem("savedDesign", JSON.stringify(designData));
    toast.success("Design saved successfully!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your design...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Made responsive */}
      <header className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-40">
        <div className="container mx-auto px-2 sm:px-4 py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/plumbing-config")}
                className="flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>

              <div className="flex-1 sm:flex-none">
                <h1 className="text-lg sm:text-xl font-semibold leading-tight">
                  Design Your Shower
                </h1>
                {state.configuration.showerTypeName && (
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {state.configuration.showerTypeName} •{" "}
                    {state.configuration.plumbingConfig} Plumbing
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex items-center gap-2 cursor-pointer"
              >
                {isMobile ? (
                  <Smartphone className="h-4 w-4" />
                ) : (
                  <Monitor className="h-4 w-4" />
                )}
                <span className="hidden lg:inline">
                  {isMobile ? "Mobile" : "Desktop"} View
                </span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDesign}
                className="cursor-pointer"
              >
                <Save className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Save</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info("Print coming soon")}
                className="cursor-pointer"
              >
                <Printer className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Print</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info("Export coming soon")}
                className="cursor-pointer"
              >
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Configurator */}
      <div className="container mx-auto p-1 sm:p-2">
        {isMobile ? (
          <MobileConfigurator
            state={state}
            onCategorySelect={handleCategorySelect}
            onSubcategorySelect={handleSubcategorySelect}
            onProductSelect={handleProductSelect}
            onVariantSelect={handleVariantSelect}
            onRemoveProduct={handleRemoveProduct}
          />
        ) : (
          <DesktopConfigurator
            state={state}
            onCategorySelect={handleCategorySelect}
            onSubcategorySelect={handleSubcategorySelect}
            onProductSelect={handleProductSelect}
            onVariantSelect={handleVariantSelect}
            onRemoveProduct={handleRemoveProduct}
          />
        )}
      </div>
    </div>
  );
}
