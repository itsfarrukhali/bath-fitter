// components/configurator/desktop-configurator.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  ConfiguratorState,
  Category,
  Product,
  ProductVariant,
  Subcategory,
} from "@/types/design";
import Image from "next/image";

interface DesktopConfiguratorProps {
  state: ConfiguratorState;
  onCategorySelect: (category: Category) => void;
  onSubcategorySelect: (subcategory: Subcategory) => void;
  onProductSelect: (product: Product, variant?: ProductVariant) => void;
  onVariantSelect: (variant: ProductVariant, product: Product) => void;
  onRemoveProduct: (productKey: string) => void;
}

// ImageWithFallback component to handle image errors
const ImageWithFallback = ({ src, alt, ...props }: any) => {
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

export default function DesktopConfigurator({
  state,
  onCategorySelect,
  onSubcategorySelect,
  onProductSelect,
  onVariantSelect,
  onRemoveProduct,
}: DesktopConfiguratorProps) {
  // Check if product is selected
  // Check if product is selected
  const isProductSelected = (product: Product) => {
    const productKey = product.subcategoryId
      ? `subcategory-${product.subcategoryId}`
      : `category-${product.categoryId}`;
    return (
      !!state.selectedProducts[productKey] &&
      state.selectedProducts[productKey].product.id === product.id
    );
  };

  // Get selected product data
  const getSelectedProductData = (product: Product) => {
    const productKey = product.subcategoryId
      ? `subcategory-${product.subcategoryId}`
      : `category-${product.categoryId}`;
    return state.selectedProducts[productKey];
  };

  // Get product key for a product
  const getProductKey = (product: Product) => {
    return product.subcategoryId
      ? `subcategory-${product.subcategoryId}`
      : `category-${product.categoryId}`;
  };

  return (
    <div className="flex h-[calc(100vh-80px)] gap-4">
      {/* Sidebar - Categories & Products */}
      <div className="w-80 h-screen border-r overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Products</h2>
          <p className="text-sm text-muted-foreground">
            Select products to add to your design
          </p>
        </div>

        <div className="p-4 space-y-4">
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

                    {/* Products in Subcategory */}
                    {state.selectedSubcategory?.id === subcategory.id && (
                      <div className="ml-4 space-y-2">
                        {subcategory.products?.map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            isSelected={isProductSelected(product)}
                            selectedProduct={getSelectedProductData(product)}
                            onSelect={onProductSelect}
                            onVariantSelect={onVariantSelect}
                            getProductKey={getProductKey}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}

              {/* Direct Products (no subcategories) */}
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
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Design Area - Square Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Design Canvas */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300">
            {/* Base Image */}
            <ImageWithFallback
              src={state.baseImage}
              alt="Shower Base"
              fill
              className="object-contain p-4"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />

            {/* Product Overlays - Multiple products */}
            {Object.entries(state.selectedProducts).map(
              ([productKey, selectedProduct], index) => {
                const imageUrl =
                  selectedProduct.variant?.imageUrl ||
                  selectedProduct.product?.imageUrl;
                if (!imageUrl) return null;

                return (
                  <ImageWithFallback
                    key={productKey}
                    src={imageUrl}
                    alt={selectedProduct.product?.name || "Product"}
                    fill
                    className="object-contain p-4"
                    style={{
                      opacity: 1,
                      zIndex: index + 1,
                    }}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                );
              }
            )}
          </div>
        </div>

        {/* Selected Products Panel - Show ALL selected products */}
        {Object.keys(state.selectedProducts).length > 0 && (
          <div className="mt-4 p-4 border rounded-lg">
            <h3 className="font-semibold mb-3">Selected Products</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {Object.entries(state.selectedProducts).map(
                ([productKey, selectedProduct]) => (
                  <div key={productKey} className="border rounded p-3 relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveProduct(productKey)}
                      className="absolute top-2 right-2 h-6 w-6 p-0 cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </Button>

                    <div className="flex justify-between items-center mb-2 pr-8">
                      <h4 className="font-medium">
                        {selectedProduct.product?.name}
                      </h4>
                      <Badge variant="secondary">
                        {selectedProduct.variant?.colorName || "Default"}
                      </Badge>
                    </div>

                    {selectedProduct.product?.variants?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedProduct.product.variants.map((variant) => (
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
                            className="cursor-pointer h-8 px-2"
                          >
                            {variant.colorCode ? (
                              <div
                                className="w-4 h-4 rounded mr-1"
                                style={{ backgroundColor: variant.colorCode }}
                              />
                            ) : null}
                            <span className="text-xs">{variant.colorName}</span>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Product Card Component
// Product Card Component
function ProductCard({
  product,
  isSelected,
  selectedProduct,
  onSelect,
  onVariantSelect,
}: {
  product: Product;
  isSelected: boolean;
  selectedProduct?: any;
  onSelect: (product: Product, variant?: ProductVariant) => void;
  onVariantSelect: (variant: ProductVariant, product: Product) => void;
  getProductKey: (product: Product) => string;
}) {
  const handleProductClick = () => {
    // Auto-select first variant if available
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
          {/* Product Thumbnail */}
          <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
            {product.thumbnailUrl ? (
              <Image
                src={product.thumbnailUrl}
                alt={product.name}
                className="w-full h-full object-cover rounded"
                width={64}
                height={64}
                onError={(e) => {
                  e.currentTarget.src = "/images/placeholder.png";
                }}
              />
            ) : (
              <div className="w-8 h-8 text-gray-400">📷</div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{product.name}</h4>
            <p className="text-xs text-muted-foreground truncate">
              {product.description || "No description"}
            </p>

            {/* Variants */}
            {product.variants?.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">
                  Colors: {selectedProduct?.variant?.colorName || "Select"}
                </p>
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
                    <span className="text-xs text-muted-foreground">
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
