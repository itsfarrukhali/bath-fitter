// components/configurator/mobile-configurator.tsx
"use client";

import { useState } from "react";
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
import Image, { ImageProps } from "next/image";

interface MobileConfiguratorProps {
  state: ConfiguratorState;
  onCategorySelect: (category: Category) => void;
  onSubcategorySelect: (subcategory: Subcategory) => void;
  onProductSelect: (product: Product, variant?: ProductVariant) => void;
  onVariantSelect: (variant: ProductVariant, product: Product) => void;
  onRemoveProduct: (productKey: string) => void;
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

export default function MobileConfigurator({
  state,
  onCategorySelect,
  onSubcategorySelect,
  onProductSelect,
  onVariantSelect,
  onRemoveProduct,
}: MobileConfiguratorProps) {
  const [activeTab, setActiveTab] = useState<
    "categories" | "products" | "selected"
  >("categories");

  // Helper functions
  const isProductSelected = (product: Product) => {
    const productKey = product.subcategoryId
      ? `subcategory-${product.subcategoryId}`
      : `category-${product.categoryId}`;
    return (
      !!state.selectedProducts[productKey] &&
      state.selectedProducts[productKey].product.id === product.id
    );
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
    if (state.selectedSubcategory) {
      return state.selectedSubcategory.products || [];
    }
    if (state.selectedCategory && !state.selectedCategory.hasSubcategories) {
      return state.selectedCategory.products || [];
    }
    return [];
  };

  const getAllSubcategory = (): Subcategory => ({
    id: 0,
    name: "All",
    slug: "all",
    categoryId: state.selectedCategory?.id || 0,
    products: state.selectedCategory?.products || [],
  });

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Square Design Canvas */}
      <div className="aspect-square w-full max-w-md mx-auto bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300 relative mt-4">
        {/* Base Image */}
        <ImageWithFallback
          src={state.baseImage}
          alt="Shower Base"
          fill
          className="object-contain p-4"
          sizes="(max-width: 768px) 100vw, 50vw"
        />

        {/* Product Overlays */}
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
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            );
          }
        )}
      </div>

      {/* Navigation Tabs - Added Selected Products tab */}
      <div className="border-b mt-4">
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
            onClick={() => setActiveTab("products")}
            className={`flex-1 rounded-none ${
              activeTab === "products" ? "border-b-2 border-primary" : ""
            }`}
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

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-2">
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
                onClick={() => onCategorySelect(category)}
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
            {/* Subcategory Navigation */}
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
              {getProductsToShow().map((product) => (
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
          </div>
        ) : (
          /* Selected Products Tab */
          <div className="space-y-3">
            {Object.entries(state.selectedProducts).length > 0 ? (
              Object.entries(state.selectedProducts).map(
                ([productKey, selectedProduct]) => (
                  <Card key={productKey} className="relative">
                    <CardContent className="p-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveProduct(productKey)}
                        className="absolute top-2 right-2 h-6 w-6 p-0 cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </Button>

                      <div className="flex gap-3 pr-8">
                        <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                          {selectedProduct.product?.thumbnailUrl ? (
                            <Image
                              src={selectedProduct.product.thumbnailUrl}
                              alt={selectedProduct.product.name}
                              className="w-full h-full object-cover rounded"
                              onError={(e) => {
                                e.currentTarget.src = "/images/placeholder.png";
                              }}
                              width={40}
                              height={40}
                            />
                          ) : (
                            <div className="w-6 h-6 text-gray-400">📷</div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {selectedProduct.product?.name}
                          </h4>
                          <Badge variant="secondary" className="mt-1">
                            {selectedProduct.variant?.colorName || "Default"}
                          </Badge>

                          {selectedProduct.product?.variants?.length > 0 && (
                            <div className="mt-2">
                              <div className="flex flex-wrap gap-1">
                                {selectedProduct.product.variants.map(
                                  (variant) => (
                                    <Button
                                      key={variant.id}
                                      variant={
                                        selectedProduct.variant?.id ===
                                        variant.id
                                          ? "default"
                                          : "outline"
                                      }
                                      size="sm"
                                      onClick={() =>
                                        onVariantSelect(
                                          variant,
                                          selectedProduct.product
                                        )
                                      }
                                      className="h-6 px-2 text-xs cursor-pointer"
                                    >
                                      {variant.colorCode ? (
                                        <div
                                          className="w-3 h-3 rounded mr-1"
                                          style={{
                                            backgroundColor: variant.colorCode,
                                          }}
                                        />
                                      ) : null}
                                      {variant.colorName}
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

// ProductCard component for mobile
function ProductCard({
  product,
  isSelected,
  selectedProduct,
  onSelect,
  onVariantSelect,
}: {
  product: Product;
  isSelected: boolean;
  selectedProduct?: { product: Product; variant?: ProductVariant };
  onSelect: (product: Product, variant?: ProductVariant) => void;
  onVariantSelect: (variant: ProductVariant, product: Product) => void;
  getProductKey: (product: Product) => string;
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
              <Image
                src={product.thumbnailUrl}
                alt={product.name}
                className="w-full h-full object-cover rounded"
                onError={(e) => {
                  e.currentTarget.src = "/images/placeholder.png";
                }}
                width={40}
                height={40}
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
