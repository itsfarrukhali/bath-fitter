// components/design/design-sidebar.tsx
"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Category, Product, ProductVariant } from "@/types/design";

interface DesignSidebarProps {
  categories: Category[];
  selectedCategory: Category | null;
  selectedSubcategory: Category["subcategories"][0] | null;
  selectedProduct: { product: Product; variant?: ProductVariant } | null;
  onCategorySelect: (category: Category) => void;
  onSubcategorySelect: (subcategory: Category["subcategories"][0]) => void;
  onProductSelect: (product: Product, variant?: ProductVariant) => void;
  onVariantSelect: (variant: ProductVariant) => void;
}

export default function DesignSidebar({
  categories,
  selectedCategory,
  selectedSubcategory,
  selectedProduct,
  onCategorySelect,
  onSubcategorySelect,
  onProductSelect,
  onVariantSelect,
}: DesignSidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    new Set()
  );

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

  const isCategoryExpanded = (categoryId: number) =>
    expandedCategories.has(categoryId);

  return (
    <aside className="w-80 border-r bg-white overflow-y-auto">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Products</h2>
        <p className="text-sm text-muted-foreground">
          Select products to add to your design
        </p>
      </div>

      <div className="p-4 space-y-2">
        {categories.map((category) => (
          <div key={category.id} className="space-y-1">
            {/* Category Header */}
            <div
              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                selectedCategory?.id === category.id
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => {
                onCategorySelect(category);
                if (category.hasSubcategories) {
                  toggleCategory(category.id);
                }
              }}
            >
              <span className="font-medium">{category.name}</span>
              {category.hasSubcategories && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCategory(category.id);
                  }}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  {isCategoryExpanded(category.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>

            {/* Subcategories */}
            <AnimatePresence>
              {isCategoryExpanded(category.id) &&
                category.subcategories.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ml-4 space-y-1"
                  >
                    {category.subcategories.map((subcategory) => (
                      <div
                        key={subcategory.id}
                        className={`p-2 rounded cursor-pointer transition-colors ${
                          selectedSubcategory?.id === subcategory.id
                            ? "bg-primary/5 text-primary"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => onSubcategorySelect(subcategory)}
                      >
                        <span className="text-sm">{subcategory.name}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {subcategory.products?.length}
                        </Badge>
                      </div>
                    ))}
                  </motion.div>
                )}
            </AnimatePresence>

            {/* Products */}
            <AnimatePresence>
              {(!category.hasSubcategories || selectedSubcategory) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-2 gap-2 mt-2"
                >
                  {(selectedSubcategory
                    ? selectedSubcategory?.products
                    : category?.products
                  ).map((product: Product) => (
                    <Card
                      key={product.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedProduct?.product.id === product.id
                          ? "ring-2 ring-primary"
                          : ""
                      }`}
                      onClick={() => onProductSelect(product)}
                    >
                      <CardContent className="p-3">
                        <div className="aspect-square relative mb-2 bg-gray-100 rounded">
                          <ImageIcon className="w-full h-full text-gray-300" />
                          {product.thumbnailUrl && (
                            <img
                              src={product.thumbnailUrl}
                              alt={product.name}
                              className="absolute inset-0 w-full h-full object-cover rounded"
                            />
                          )}
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium truncate">
                            {product.name}
                          </h4>
                          {product.variants?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {product.variants
                                .slice(0, 3)
                                .map((variant: ProductVariant) => (
                                  <div
                                    key={variant.id}
                                    className="w-4 h-4 rounded border cursor-pointer"
                                    style={{
                                      backgroundColor: variant.colorCode,
                                    }}
                                    title={variant.colorName}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onVariantSelect(variant);
                                    }}
                                  />
                                ))}
                              {product.variants.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{product.variants.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </aside>
  );
}
