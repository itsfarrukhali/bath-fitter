"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTheme } from "next-themes";
import {
  Menu,
  Sun,
  Moon,
  Download,
  Save,
  ChevronDown,
  ChevronRight,
  Palette,
  ImageIcon,
} from "lucide-react";
import { Category, CategoryResponse } from "@/types/category";
import { Product, ProductVariant } from "@/types/products";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";

interface PlacedProduct {
  product: Product;
  variant: ProductVariant | null;
  position: { x: number; y: number };
  scale: number;
}

const ProductConfigurator = () => {
  // State Management
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [placedProducts, setPlacedProducts] = useState<PlacedProduct[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    new Set()
  );
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [colorModalOpen, setColorModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();

  // Base template image
  const baseImageUrl = "/images/shower-base-main.png";

  // Responsive detection
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Fetch categories
  const fetchCategories = async (showerTypeId: number) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get<CategoryResponse>(
        `/api/categories?showerTypeId=${showerTypeId}&includeProducts=true`
      );

      if (!data.success) throw new Error(data.message);

      setCategories(data.data);
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
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/products?limit=100");
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await fetchCategories(1);
        await fetchProducts();
      } catch (error) {
        console.error("Failed to load categories:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const fetchVariants = async (productId: number) => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/variants?productId=${productId}`);
      if (data.success) {
        setVariants(data.data);
      }
    } catch (error) {
      console.error("Error fetching variants:", error);
      if (error instanceof AxiosError) {
        toast.error(
          error.response?.data?.message || "Failed to fetch variants"
        );
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to fetch variants");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle product selection
  const handleProductClick = async (product: Product) => {
    setSelectedProduct(product);
    setLoading(true);

    try {
      await fetchVariants(product.id);
      if (variants.length > 0) {
        setColorModalOpen(true);
      } else {
        placeProduct(product, null);
      }
    } catch (error) {
      console.error("Failed to load product variants:", error);
    } finally {
      setLoading(false);
    }
  };

  // Place product on canvas
  const placeProduct = (product: Product, variant: ProductVariant | null) => {
    const newPlacedProduct: PlacedProduct = {
      product,
      variant,
      position: { x: 100, y: 100 },
      scale: 1,
    };

    setPlacedProducts((prev) => [...prev, newPlacedProduct]);
    setColorModalOpen(false);
    setSidebarOpen(false);
  };

  // Handle variant selection
  const handleVariantSelect = (variant: ProductVariant) => {
    if (selectedProduct) {
      placeProduct(selectedProduct, variant);
    }
  };

  // Toggle category expansion
  const toggleCategory = (categoryId: number) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Save design
  const handleSaveDesign = () => {
    const designData = {
      placedProducts,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem("saved-design", JSON.stringify(designData));
    console.log("Design saved:", designData);
    toast.success("Design saved successfully");
  };

  // Download design
  const handleDownloadDesign = () => {
    console.log("Download functionality to be implemented");
    toast.info("Download functionality to be implemented");
  };

  // Category Header Component
  const CategoryHeader = () => (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-4">
        {isMobile && (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle>Products</SheetTitle>
              </SheetHeader>
              <SidebarContent />
            </SheetContent>
          </Sheet>
        )}

        <div className="flex items-center gap-4 overflow-x-auto">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "ghost"}
              onClick={() => setSelectedCategory(category.id)}
              className="whitespace-nowrap"
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleSaveDesign}>
          <Save className="h-4 w-4 mr-1" />
          Save
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownloadDesign}>
          <Download className="h-4 w-4 mr-1" />
          Download
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );

  // Sidebar Content Component
  const SidebarContent = () => (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {categories.map((category) => (
          <div key={category.id} className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-between p-2 h-auto"
              onClick={() => toggleCategory(category.id)}
            >
              <span className="font-medium">{category.name}</span>
              {expandedCategories.has(category.id) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>

            {expandedCategories.has(category.id) && (
              <div className="ml-4 space-y-3">
                {category.subcategories.map((subcategory) => (
                  <div key={subcategory.id} className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      {subcategory.name}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {subcategory.products?.map((product) => (
                        <Card
                          key={product.id}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => handleProductClick(product)}
                        >
                          <CardContent className="p-2">
                            <div className="aspect-square bg-muted rounded mb-2 flex items-center justify-center">
                              {product.thumbnailUrl ? (
                                <img
                                  src={product.thumbnailUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover rounded"
                                />
                              ) : (
                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                              )}
                            </div>
                            <p className="text-xs text-center font-medium">
                              {product.name}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );

  // Mobile Products List Component
  const MobileProductsList = () => {
    const selectedCat = categories.find((cat) => cat.id === selectedCategory);
    if (!selectedCat) return null;

    return (
      <div className="p-4">
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4">
            {selectedCat.subcategories.map((subcategory) => (
              <div key={subcategory.id} className="flex-shrink-0">
                <h3 className="text-sm font-medium mb-2">{subcategory.name}</h3>
                <div className="flex gap-2">
                  {subcategory.products?.map((product) => (
                    <Card
                      key={product.id}
                      className="cursor-pointer hover:shadow-md transition-shadow w-20"
                      onClick={() => handleProductClick(product)}
                    >
                      <CardContent className="p-2">
                        <div className="aspect-square bg-muted rounded mb-1 flex items-center justify-center">
                          {product.thumbnailUrl ? (
                            <img
                              src={product.thumbnailUrl}
                              alt={product.name}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-xs text-center">{product.name}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  };

  // Color Variant Modal
  const ColorVariantModal = () => (
    <Dialog open={colorModalOpen} onOpenChange={setColorModalOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Choose Color
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select a color variant for {selectedProduct?.name}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {variants.map((variant) => (
              <Card
                key={variant.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleVariantSelect(variant)}
              >
                <CardContent className="p-3">
                  <div className="aspect-square bg-muted rounded mb-2 flex items-center justify-center">
                    <img
                      src={variant.imageUrl}
                      alt={variant.colorName}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: variant.colorCode }}
                    />
                    <span className="text-sm font-medium">
                      {variant.colorName}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() =>
              selectedProduct && placeProduct(selectedProduct, null)
            }
          >
            Use Default (No Color)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Canvas Component
  const Canvas = () => (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-lg max-w-2xl w-full aspect-[4/3]">
        <img
          src={baseImageUrl}
          alt="Base Template"
          className="w-full h-full object-cover rounded-lg"
        />

        {placedProducts.map((placedProduct, index) => (
          <div
            key={index}
            className="absolute cursor-move"
            style={{
              left: placedProduct.position.x,
              top: placedProduct.position.y,
              transform: `scale(${placedProduct.scale})`,
            }}
          >
            <img
              src={
                placedProduct.variant?.imageUrl || "/api/placeholder/100/100"
              }
              alt={placedProduct.product.name}
              className="max-w-[100px] max-h-[100px] object-contain drop-shadow-lg"
            />
          </div>
        ))}

        {placedProducts.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <ImageIcon className="h-12 w-12 mx-auto mb-2" />
              <p className="text-lg font-medium">Start Designing</p>
              <p className="text-sm">
                Select products from the {isMobile ? "menu" : "sidebar"} to
                begin
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (loading && categories.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading configurator...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <CategoryHeader />

      <div className="flex flex-1 overflow-hidden">
        {!isMobile && (
          <div className="w-80 border-r">
            <SidebarContent />
          </div>
        )}

        <div className="flex-1 flex flex-col">
          <Canvas />

          {isMobile && selectedCategory && (
            <div className="border-t">
              <MobileProductsList />
            </div>
          )}
        </div>
      </div>

      <ColorVariantModal />
    </div>
  );
};

export default ProductConfigurator;
