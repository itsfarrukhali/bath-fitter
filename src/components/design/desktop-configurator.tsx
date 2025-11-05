// components/design/desktop-configurator.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
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
  // Add null checks for product and its properties
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

export default function DesktopConfigurator({
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
    .filter(([, selectedProduct]) => selectedProduct && selectedProduct.product) // Enhanced filter
    .sort(([, selectedA], [, selectedB]) => {
      const zIndexA = getCategoryZIndex(selectedA.product);
      const zIndexB = getCategoryZIndex(selectedB.product);
      return zIndexA - zIndexB;
    });

  return (
    <div className="flex h-[calc(100vh-80px)] gap-4 overflow-hidden">
      {/* Left Sidebar - Selected Products Panel (NEW POSITION) */}
      {Object.keys(state.selectedProducts).length > 0 && (
        <div className="w-72 border-r overflow-y-auto flex flex-col bg-background">
          <div className="p-4 border-b bg-muted/30 sticky top-0 z-10">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-sm">Selected Products</h3>
              <Badge variant="secondary" className="text-xs">
                {Object.keys(state.selectedProducts).length} items
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
          className="relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden shadow-inner"
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
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-3" />
                <p className="text-sm text-muted-foreground">
                  Loading base image...
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
            <div className="absolute top-4 left-4 bg-black/80 text-white px-3 py-2 rounded-lg text-sm font-medium z-50 shadow-lg">
              {Math.round(zoomLevel * 100)}% • Drag to pan
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Categories & Products */}
      <div className="w-80 border-l overflow-y-auto flex flex-col bg-background">
        <div className="p-4 border-b bg-muted/30 sticky top-0 z-10">
          <h2 className="text-lg font-semibold">Products</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Select products to add
          </p>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {state.categories.map((category) => (
              <Button
                key={category.id}
                variant={
                  state.selectedCategory?.id === category.id
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() => onCategorySelect(category)}
                className="cursor-pointer"
              >
                {category.name}
              </Button>
            ))}
          </div>

          {/* Category Tree */}
          {state.selectedCategory && (
            <div className="space-y-3">
              {/* Subcategories */}
              {state.selectedCategory.hasSubcategories &&
                state.selectedCategory.subcategories?.map((subcategory) => (
                  <div key={subcategory.id} className="space-y-2">
                    <Button
                      variant={
                        state.selectedSubcategory?.id === subcategory.id
                          ? "default"
                          : "outline"
                      }
                      onClick={() => onSubcategorySelect(subcategory)}
                      className="w-full justify-between cursor-pointer"
                    >
                      <span>{subcategory.name}</span>
                      <Badge variant="secondary">
                        {subcategory.products?.length || 0}
                      </Badge>
                    </Button>

                    {state.selectedSubcategory?.id === subcategory.id && (
                      <div className="ml-2 space-y-2">
                        {subcategory.products?.map((product) => (
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
                        ))}
                      </div>
                    )}
                  </div>
                ))}

              {/* Direct Products */}
              {!state.selectedCategory.hasSubcategories && (
                <div className="space-y-2">
                  {state.selectedCategory.products?.map((product) => (
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
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
}) {
  const handleProductClick = () => {
    const firstVariant = product.variants?.[0];
    onSelect(product, firstVariant);
  };

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? "ring-2 ring-primary shadow-lg" : ""
      }`}
      onClick={handleProductClick}
    >
      <CardContent className="p-3">
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-14 h-14 bg-gray-100 rounded overflow-hidden">
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
