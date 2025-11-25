// components/design/mobile-configurator.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, X, ZoomIn, ZoomOut } from "lucide-react";
import {
  ConfiguratorState,
  Category,
  Product,
  ProductVariant,
  Subcategory,
  SelectedProduct,
} from "@/types/design";
import Image, { ImageProps } from "next/image";
import { PlumbingAwareImage } from "../plumbing-aware-image";

interface MobileConfiguratorProps {
  state: ConfiguratorState;
  onCategorySelect: (category: Category) => void;
  onSubcategorySelect: (subcategory: Subcategory | null) => void;
  onProductSelect: (product: Product, variant?: ProductVariant) => void;
  onVariantSelect: (variant: ProductVariant, product: Product) => void;
  onRemoveProduct: (productKey: string) => void;
  zoomLevel: number;
  position: { x: number; y: number };
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onImageLoad?: () => void;
  onImageError?: () => void;
  imageLoading?: boolean;
}

// ImageWithFallback component for mobile
const ImageWithFallback = ({ src, alt, ...props }: ImageProps) => {
  return (
    <Image
      src={src || "/images/placeholder.png"}
      alt={alt}
      onError={(e) => {
        e.currentTarget.src = "/images/placeholder.png";
      }}
      {...props}
    />
  );
};

const getCategoryZIndex = (product: Product | undefined): number => {
  // Priority order: product z_index > subcategory z_index > category z_index > default
  if (!product) return 50;

  const productZIndex = product?.z_index;
  const subcategoryZIndex = product.subcategory?.z_index;
  const categoryZIndex = product.category?.z_index;

  let finalZIndex = productZIndex || subcategoryZIndex || categoryZIndex || 50;

  // Ensure z-index is integer for proper rendering
  finalZIndex = Math.round(finalZIndex);

  // Add small offsets to avoid exact ties (but keep as integer)
  const categoryIdOffset = (product.categoryId || 0) * 0.01;
  const subIdOffset = (product.subcategoryId || 0) * 0.001;
  const productIdOffset = (product.id % 100) * 0.0001;

  return Math.round(
    finalZIndex + categoryIdOffset + subIdOffset + productIdOffset
  );
};

export default function MobileConfigurator({
  state,
  onCategorySelect,
  onSubcategorySelect,
  onProductSelect,
  onVariantSelect,
  onRemoveProduct,
  zoomLevel,
  position,
  isDragging,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onImageLoad,
  onImageError,
  imageLoading = false,
}: MobileConfiguratorProps) {
  const [activeTab, setActiveTab] = useState<
    "categories" | "products" | "selected"
  >("categories");

  useEffect(() => {
    if (state.selectedCategory && state.selectedCategory.hasSubcategories) {
      // Auto-select first subcategory when category changes
      const firstSubcategory = state.selectedCategory.subcategories?.[0];
      if (firstSubcategory && !state.selectedSubcategory) {
        onSubcategorySelect(firstSubcategory);
      }
    } else {
      // Clear subcategory if category doesn't have subcategories
      if (state.selectedSubcategory) {
        onSubcategorySelect(null);
      }
    }
  }, [state.selectedCategory, state.selectedSubcategory, onSubcategorySelect]);

  // Helper functions
  const isProductSelected = (product: Product) => {
    const productKey = product.subcategoryId
      ? `subcategory-${product.subcategoryId}`
      : `category-${product.categoryId}`;
    const selected = state.selectedProducts[productKey];
    return !!selected && selected.product?.id === product.id;
  };

  const getSelectedProductData = (product: Product) => {
    const productKey = product.subcategoryId
      ? `subcategory-${product.subcategoryId}`
      : `category-${product.categoryId}`;
    return state.selectedProducts[productKey];
  };

  const getProductKey = (product: Product) => {
    return product.subcategoryId
      ? `subcategory-${product.subcategoryId}`
      : `category-${product.categoryId}`;
  };

  const getProductsToShow = () => {
    // If we have a selected subcategory, show its products
    if (state.selectedSubcategory && state.selectedSubcategory.id !== 0) {
      return state.selectedSubcategory.products || [];
    }

    // If category has subcategories but no specific subcategory is selected,
    // show products from all subcategories
    if (state.selectedCategory?.hasSubcategories) {
      const allProducts: Product[] = [];
      state.selectedCategory.subcategories?.forEach((subcategory) => {
        if (subcategory.products) {
          allProducts.push(...subcategory.products);
        }
      });
      return allProducts;
    }

    // If category doesn't have subcategories, show its direct products
    if (state.selectedCategory && !state.selectedCategory.hasSubcategories) {
      return state.selectedCategory.products || [];
    }

    return [];
  };

  const getAllSubcategory = (): Subcategory => ({
    id: 0,
    name: "All",
    slug: "all",
    z_index: 30,
    categoryId: state.selectedCategory?.id || 0,
    products: getProductsToShow(),
  });

  // Sort products by z-index for proper layering
  const sortedSelectedProducts = Object.entries(state.selectedProducts)
    .filter(([, selectedProduct]) => selectedProduct && selectedProduct.product) // Synced filter
    .sort(([, selectedA], [, selectedB]) => {
      const zIndexA = getCategoryZIndex(selectedA.product);
      const zIndexB = getCategoryZIndex(selectedB.product);
      return zIndexA - zIndexB;
    });

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Square Design Canvas with Zoom Controls */}
      <div className="relative">
        <div
          id="design-canvas"
          className="aspect-square w-full max-w-md mx-auto bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300 relative mt-4 overflow-hidden"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          style={{
            cursor:
              zoomLevel > 1 ? (isDragging ? "grabbing" : "grab") : "default",
          }}
        >
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
                <p className="text-sm text-muted-foreground">
                  Loading base image...
                </p>
              </div>
            </div>
          )}
          <div
            className="absolute inset-0 transition-transform duration-200 ease-out"
            style={{
              transform: `scale(${zoomLevel}) translate(${position.x}px, ${position.y}px)`,
              transformOrigin: "center center",
            }}
          >
            {/* Base Image */}
            <ImageWithFallback
              src={state.baseImage}
              alt="Shower Base"
              fill
              className="object-contain p-4"
              sizes="(max-width: 768px) 100vw, 50vw"
              onLoad={onImageLoad}
              onError={onImageError}
            />

            {/* Product Overlays */}
            {sortedSelectedProducts.map(([productKey, selectedProduct]) => {
              const imageUrl =
                selectedProduct.variant?.imageUrl ||
                selectedProduct.product?.imageUrl;
              if (!imageUrl) return null;

              const zIndex = getCategoryZIndex(selectedProduct.product);

              return (
                <div
                  key={productKey}
                  className="absolute inset-0"
                  style={{ zIndex, pointerEvents: "none" }}
                >
                  <PlumbingAwareImage
                    src={imageUrl}
                    alt={selectedProduct.product?.name || "Product"}
                    fill
                    className="object-contain p-6"
                    sizes="100vw"
                    plumbingConfig={state.configuration.plumbingConfig}
                    variantPlumbingConfig={
                      selectedProduct.variant?.plumbing_config
                    }
                  />
                </div>
              );
            })}
          </div>

          {/* Zoom level indicator */}
          {zoomLevel > 1 && (
            <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm z-50">
              {Math.round(zoomLevel * 100)}% - Drag to pan
            </div>
          )}
        </div>

        {/* Mobile Zoom Controls */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-background/95 backdrop-blur-sm rounded-lg p-1 border z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomOut}
            className="h-8 w-8 p-0 cursor-pointer"
            disabled={zoomLevel <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetZoom}
            className="h-8 px-2 text-xs cursor-pointer"
          >
            {Math.round(zoomLevel * 100)}%
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomIn}
            className="h-8 w-8 p-0 cursor-pointer"
            disabled={zoomLevel >= 1.5}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Navigation Tabs - Added Selected Products tab */}
      <div className="border-b mt-4 bg-background z-10">
        <div className="flex">
          <Button
            variant="ghost"
            onClick={() => setActiveTab("categories")}
            className={`flex-1 rounded-none ${
              activeTab === "categories" ? "border-b-2 border-primary" : ""
            }`}
          >
            Categories
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setActiveTab("products");
              // FIX: Ensure we have a category selected when switching to products tab
              if (!state.selectedCategory && state.categories.length > 0) {
                onCategorySelect(state.categories[0]);
              }
            }}
            className={`flex-1 rounded-none ${
              activeTab === "products" ? "border-b-2 border-primary" : ""
            }`}
            disabled={!state.selectedCategory} // Disable if no category selected
          >
            Products
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab("selected")}
            className={`flex-1 rounded-none ${
              activeTab === "selected" ? "border-b-2 border-primary" : ""
            }`}
          >
            Selected ({Object.keys(state.selectedProducts).length})
          </Button>
        </div>
      </div>

      {/* Content Area - Independent scrolling */}
      <div className="flex-1 overflow-y-auto p-2 bg-background z-10">
        {activeTab === "categories" ? (
          <div className="space-y-2">
            {state.categories.map((category) => (
              <Button
                key={category.id}
                variant={
                  state.selectedCategory?.id === category.id
                    ? "default"
                    : "outline"
                }
                onClick={() => {
                  onCategorySelect(category);
                  setActiveTab("products"); // Auto-switch to products tab
                }}
                className="w-full justify-between cursor-pointer"
              >
                <span>{category.name}</span>
                <Badge variant="secondary">
                  {category.hasSubcategories
                    ? `${category.subcategories?.length || 0} sub`
                    : `${category.products?.length || 0} items`}
                </Badge>
              </Button>
            ))}
          </div>
        ) : activeTab === "products" ? (
          <div className="space-y-3">
            {/* Show category info */}
            {state.selectedCategory && (
              <div className="p-2 bg-muted rounded-lg">
                <h3 className="font-semibold text-sm">
                  {state.selectedCategory.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {state.selectedCategory.description || "Select products"}
                </p>
              </div>
            )}

            {/* Subcategory Navigation - FIXED LOGIC */}
            {state.selectedCategory?.hasSubcategories && (
              <div className="flex overflow-x-auto gap-2 pb-2">
                <Button
                  variant={!state.selectedSubcategory ? "default" : "outline"}
                  size="sm"
                  onClick={() => onSubcategorySelect(getAllSubcategory())}
                  className="cursor-pointer whitespace-nowrap"
                >
                  All
                </Button>
                {state.selectedCategory.subcategories?.map((subcategory) => (
                  <Button
                    key={subcategory.id}
                    variant={
                      state.selectedSubcategory?.id === subcategory.id
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => onSubcategorySelect(subcategory)}
                    className="cursor-pointer whitespace-nowrap"
                  >
                    {subcategory.name}
                  </Button>
                ))}
              </div>
            )}

            {/* Products Grid */}
            <div className="grid grid-cols-1 gap-2">
              {getProductsToShow().length > 0 ? (
                getProductsToShow().map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isSelected={isProductSelected(product)}
                    selectedProduct={getSelectedProductData(product)}
                    onSelect={onProductSelect}
                    onVariantSelect={onVariantSelect}
                    getProductKey={getProductKey}
                    plumbingConfig={state.configuration.plumbingConfig}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No products available</p>
                  <p className="text-sm">
                    Select a different category or subcategory
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Selected Products Tab */
          <div className="space-y-3">
            {Object.keys(state.selectedProducts).length > 0 ? (
              Object.entries(state.selectedProducts).map(
                ([productKey, selectedProduct]) => (
                  <SelectedProductItem
                    key={productKey}
                    productKey={productKey}
                    selectedProduct={selectedProduct}
                    onRemoveProduct={onRemoveProduct}
                    onVariantSelect={onVariantSelect}
                    plumbingConfig={state.configuration.plumbingConfig}
                  />
                )
              )
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No products selected yet
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// SelectedProductItem component synced with desktop
function SelectedProductItem({
  productKey,
  selectedProduct,
  onRemoveProduct,
  onVariantSelect,
  plumbingConfig,
}: {
  productKey: string;
  selectedProduct: SelectedProduct;
  onRemoveProduct: (key: string) => void;
  onVariantSelect: (variant: ProductVariant, product: Product) => void;
  plumbingConfig?: string;
  showerTypeId?: number;
}) {
  if (!selectedProduct || !selectedProduct.product) return null; // Add guard

  return (
    <Card className="relative group hover:shadow-md transition-all">
      <CardContent className="p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemoveProduct(productKey)}
          className="absolute top-1 right-1 h-6 w-6 p-0 cursor-pointer hover:bg-destructive hover:text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity z-10"
          title="Remove"
        >
          <X className="h-3 w-3" />
        </Button>

        <div className="flex items-start gap-2 pr-6">
          <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded overflow-hidden">
            {selectedProduct.product?.thumbnailUrl ? (
              <PlumbingAwareImage
                src={selectedProduct.product.thumbnailUrl}
                alt={selectedProduct.product.name}
                className="w-full h-full object-cover"
                width={48}
                height={48}
                plumbingConfig={plumbingConfig}
                variantPlumbingConfig={selectedProduct.variant?.plumbing_config}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                📷
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm leading-tight truncate">
              {selectedProduct.product?.name}
            </h4>
            <Badge variant="secondary" className="text-xs mt-1">
              {selectedProduct.variant?.colorName || "Default"}
            </Badge>

            {selectedProduct.product?.variants?.length > 1 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">Colors:</p>
                <div className="flex flex-wrap gap-1">
                  {selectedProduct.product.variants.map(
                    (variant: ProductVariant) => (
                      <Button
                        key={variant.id}
                        variant={
                          selectedProduct.variant?.id === variant.id
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          onVariantSelect(variant, selectedProduct.product)
                        }
                        className="h-6 px-2 text-xs cursor-pointer"
                        title={variant.colorName}
                      >
                        {variant.colorCode && (
                          <div
                            className="w-3 h-3 rounded border mr-1"
                            style={{ backgroundColor: variant.colorCode }}
                          />
                        )}
                        <span className="truncate max-w-[60px]">
                          {variant.colorName}
                        </span>
                      </Button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ProductCard component for mobile
function ProductCard({
  product,
  isSelected,
  selectedProduct,
  onSelect,
  onVariantSelect,
  plumbingConfig,
}: {
  product: Product;
  isSelected: boolean;
  selectedProduct?: { product: Product; variant?: ProductVariant };
  onSelect: (product: Product, variant?: ProductVariant) => void;
  onVariantSelect: (variant: ProductVariant, product: Product) => void;
  getProductKey: (product: Product) => string;
  plumbingConfig?: string;
  showerTypeId?: number;
}) {
  const handleProductClick = () => {
    const firstVariant = product.variants?.[0];
    onSelect(product, firstVariant);
  };

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={handleProductClick}
    >
      <CardContent className="p-3">
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
            {product.thumbnailUrl ? (
              <PlumbingAwareImage
                src={product.thumbnailUrl}
                alt={product.name}
                className="w-full h-full object-cover"
                width={56}
                height={56}
                plumbingConfig={plumbingConfig}
                variantPlumbingConfig={
                  selectedProduct?.variant?.plumbing_config
                }
              />
            ) : (
              <div className="w-8 h-8 text-gray-400">📷</div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{product.name}</h4>
            <p className="text-xs text-muted-foreground truncate">
              {product.description || "No description"}
            </p>

            {product.variants?.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">
                  {selectedProduct?.variant?.colorName || "Select color"}
                </p>
                <div className="flex flex-wrap gap-1">
                  {product.variants.slice(0, 3).map((variant) => (
                    <Button
                      key={variant.id}
                      variant={
                        selectedProduct?.variant?.id === variant.id
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onVariantSelect(variant, product);
                      }}
                      className="w-5 h-5 p-0 rounded border hover:scale-110 transition-transform cursor-pointer"
                      style={{ backgroundColor: variant.colorCode }}
                      title={variant.colorName}
                    />
                  ))}
                  {product.variants.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{product.variants.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
