// components/design/enhanced-desktop-configurator.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, X, Search, Filter, ChevronDown, ChevronUp, Grid3x3, List } from "lucide-react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface DesktopConfiguratorProps {
  state: ConfiguratorState;
  onCategorySelect: (category: Category) => void;
  onSubcategorySelect: (subcategory: Subcategory) => void;
  onProductSelect: (product: Product, variant?: ProductVariant) => void;
  onVariantSelect: (variant: ProductVariant, product: Product) => void;
  onRemoveProduct: (productKey: string) => void;
  zoomLevel: number;
  position?: { x: number; y: number };
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onImageLoad?: () => void;
  onImageError?: () => void;
  imageLoading?: boolean;
}

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
  if (!product) return 50;

  const productZIndex = product?.z_index;
  const subcategoryZIndex = product.subcategory?.z_index;
  const categoryZIndex = product.category?.z_index;

  let finalZIndex = productZIndex || subcategoryZIndex || categoryZIndex || 50;
  finalZIndex = Math.round(finalZIndex);

  const categoryIdOffset = (product.categoryId || 0) * 0.01;
  const subIdOffset = (product.subcategoryId || 0) * 0.001;
  const productIdOffset = (product.id % 100) * 0.0001;

  return Math.round(
    finalZIndex + categoryIdOffset + subIdOffset + productIdOffset
  );
};

export default function EnhancedDesktopConfigurator({
  state,
  onCategorySelect,
  onSubcategorySelect,
  onProductSelect,
  onVariantSelect,
  onRemoveProduct,
  zoomLevel,
  position = { x: 0, y: 0 },
  isDragging,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onImageLoad,
  onImageError,
  imageLoading = false,
}: DesktopConfiguratorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  const isProductSelected = (product: Product) => {
    const productKey = product.subcategoryId
      ? `subcategory-${product.subcategoryId}`
      : `category-${product.categoryId}`;
    const selected = state.selectedProducts[productKey];
    return !!selected && selected.product?.id === product?.id;
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

  const sortedSelectedProducts = Object.entries(state.selectedProducts)
    .filter(([, selectedProduct]) => selectedProduct && selectedProduct.product)
    .sort(([, selectedA], [, selectedB]) => {
      const zIndexA = getCategoryZIndex(selectedA.product);
      const zIndexB = getCategoryZIndex(selectedB.product);
      return zIndexA - zIndexB;
    });

  // Filter products based on search
  const filterProducts = useCallback((products: Product[]) => {
    if (!searchQuery.trim()) return products;
    return products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Toggle category expansion
  const toggleCategory = (categoryId: number) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Auto-expand selected category
  useEffect(() => {
    if (state.selectedCategory) {
      setExpandedCategories(prev => new Set(prev).add(state.selectedCategory!.id));
    }
  }, [state.selectedCategory]);

  return (
    <div className="flex h-[calc(100vh-80px)] gap-4 overflow-hidden">
      {/* Left Sidebar - Selected Products Panel */}
      {Object.keys(state.selectedProducts).length > 0 && (
        <div className="w-72 border-r overflow-y-auto flex flex-col bg-background shadow-sm">
          <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10 sticky top-0 z-10 backdrop-blur-sm">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                Selected Products
              </h3>
              <Badge variant="default" className="text-xs">
                {Object.keys(state.selectedProducts).length}
              </Badge>
            </div>
          </div>
          <div className="p-3 space-y-2 flex-1">
            {Object.entries(state.selectedProducts).map(
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
            )}
          </div>
        </div>
      )}

      {/* Center - Large Design Canvas */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
        <div
          id="design-canvas"
          className="relative w-full h-full bg-gradient-to-br from-gray-50 via-white to-gray-100 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden shadow-2xl"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          style={{
            cursor:
              zoomLevel > 1 ? (isDragging ? "grabbing" : "grab") : "default",
          }}
        >
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 z-10">
              <div className="text-center space-y-3">
                <div className="relative">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                  <div className="absolute inset-0 h-12 w-12 mx-auto rounded-full bg-primary/20 animate-ping" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  Loading your canvas...
                </p>
              </div>
            </div>
          )}

          {/* Base Image with Zoom & Pan */}
          <div
            className="absolute inset-0 transition-transform duration-200 ease-out"
            style={{
              transform: `scale(${zoomLevel}) translate(${position.x}px, ${position.y}px)`,
              transformOrigin: "center center",
            }}
          >
            <ImageWithFallback
              src={state.baseImage}
              alt="Shower Base"
              fill
              className="object-contain p-6"
              sizes="100vw"
              priority
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

          {/* Zoom Indicator */}
          {zoomLevel > 1 && (
            <div className="absolute top-4 left-4 bg-black/90 text-white px-4 py-2 rounded-lg text-sm font-medium z-50 shadow-xl backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                {Math.round(zoomLevel * 100)}% • Drag to pan
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Categories & Products */}
      <div className="w-96 border-l overflow-y-auto flex flex-col bg-background shadow-sm">
        <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10 sticky top-0 z-10 backdrop-blur-sm space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Product Library</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Browse and select products
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-7 px-2 cursor-pointer"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-7 px-2 cursor-pointer"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
            </div>
            <Badge variant="outline" className="text-xs">
              {state.categories.length} categories
            </Badge>
          </div>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {/* Category Accordion */}
          {state.categories.map((category) => {
            const isExpanded = expandedCategories.has(category.id);
            const isSelected = state.selectedCategory?.id === category.id;

            return (
              <Collapsible
                key={category.id}
                open={isExpanded}
                onOpenChange={() => toggleCategory(category.id)}
              >
                <Card className={`overflow-hidden transition-all ${isSelected ? 'ring-2 ring-primary shadow-md' : ''}`}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-4 h-auto hover:bg-muted/50 cursor-pointer"
                      onClick={() => onCategorySelect(category)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <span className="text-lg">{category.name.charAt(0)}</span>
                        </div>
                        <div className="text-left">
                          <h4 className="font-semibold text-sm">{category.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {category.hasSubcategories
                              ? `${category.subcategories?.length || 0} subcategories`
                              : `${category.products?.length || 0} products`}
                          </p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="p-4 pt-0 space-y-2 bg-muted/20">
                      {/* Subcategories */}
                      {category.hasSubcategories &&
                        category.subcategories?.map((subcategory) => {
                          const filteredProducts = filterProducts(subcategory.products || []);
                          if (filteredProducts.length === 0 && searchQuery) return null;

                          return (
                            <div key={subcategory.id} className="space-y-2">
                              <Button
                                variant={
                                  state.selectedSubcategory?.id === subcategory.id
                                    ? "default"
                                    : "outline"
                                }
                                onClick={() => onSubcategorySelect(subcategory)}
                                className="w-full justify-between cursor-pointer"
                                size="sm"
                              >
                                <span>{subcategory.name}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {filteredProducts.length}
                                </Badge>
                              </Button>

                              {state.selectedSubcategory?.id === subcategory.id && (
                                <div className={`space-y-2 ${viewMode === 'grid' ? 'grid grid-cols-2 gap-2' : ''}`}>
                                  {filteredProducts.map((product) => (
                                    <ProductCard
                                      key={product.id}
                                      product={product}
                                      isSelected={isProductSelected(product)}
                                      selectedProduct={getSelectedProductData(product)}
                                      onSelect={onProductSelect}
                                      onVariantSelect={onVariantSelect}
                                      getProductKey={getProductKey}
                                      plumbingConfig={state.configuration.plumbingConfig}
                                      viewMode={viewMode}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}

                      {/* Direct Products */}
                      {!category.hasSubcategories && (
                        <div className={`space-y-2 ${viewMode === 'grid' ? 'grid grid-cols-2 gap-2' : ''}`}>
                          {filterProducts(category.products || []).map((product) => (
                            <ProductCard
                              key={product.id}
                              product={product}
                              isSelected={isProductSelected(product)}
                              selectedProduct={getSelectedProductData(product)}
                              onSelect={onProductSelect}
                              onVariantSelect={onVariantSelect}
                              getProductKey={getProductKey}
                              plumbingConfig={state.configuration.plumbingConfig}
                              viewMode={viewMode}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Selected Product Item Component
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
}) {
  if (!selectedProduct || !selectedProduct.product) return null;

  return (
    <Card className="relative group hover:shadow-lg transition-all border-l-4 border-l-primary">
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
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden shadow-sm">
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
                        className="h-6 px-2 text-xs cursor-pointer hover:scale-105 transition-transform"
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

// Product Card Component
function ProductCard({
  product,
  isSelected,
  selectedProduct,
  onSelect,
  onVariantSelect,
  plumbingConfig,
  viewMode = "list",
}: {
  product: Product;
  isSelected: boolean;
  selectedProduct?: { product: Product; variant?: ProductVariant };
  onSelect: (product: Product, variant?: ProductVariant) => void;
  onVariantSelect: (variant: ProductVariant, product: Product) => void;
  getProductKey: (product: Product) => string;
  plumbingConfig?: string;
  viewMode?: "grid" | "list";
}) {
  const handleProductClick = () => {
    const firstVariant = product.variants?.[0];
    onSelect(product, firstVariant);
  };

  if (viewMode === "grid") {
    return (
      <Card
        className={`cursor-pointer transition-all hover:shadow-md hover:scale-105 ${
          isSelected ? "ring-2 ring-primary shadow-lg" : ""
        }`}
        onClick={handleProductClick}
      >
        <CardContent className="p-2">
          <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden mb-2">
            {product.thumbnailUrl ? (
              <PlumbingAwareImage
                src={product.thumbnailUrl}
                alt={product.name}
                className="w-full h-full object-cover"
                width={100}
                height={100}
                plumbingConfig={plumbingConfig}
                variantPlumbingConfig={
                  selectedProduct?.variant?.plumbing_config
                }
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                📷
              </div>
            )}
          </div>
          <h4 className="font-medium text-xs truncate">{product.name}</h4>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${
        isSelected ? "ring-2 ring-primary shadow-lg bg-primary/5" : ""
      }`}
      onClick={handleProductClick}
    >
      <CardContent className="p-3">
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden shadow-sm">
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
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                📷
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{product.name}</h4>
            <p className="text-xs text-muted-foreground truncate">
              {product.description || "No description"}
            </p>

            {product.variants?.length > 0 && (
              <div className="mt-2">
                <div className="flex flex-wrap gap-1">
                  {product.variants.slice(0, 4).map((variant) => (
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
                      className="w-6 h-6 p-0 rounded border hover:scale-110 transition-transform cursor-pointer"
                      style={{ backgroundColor: variant.colorCode }}
                      title={variant.colorName}
                    />
                  ))}
                  {product.variants.length > 4 && (
                    <span className="text-xs text-muted-foreground self-center">
                      +{product.variants.length - 4}
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
