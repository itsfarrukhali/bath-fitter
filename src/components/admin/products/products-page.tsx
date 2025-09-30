// app/admin/products/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import axios, { AxiosError } from "axios";
import { Plus, Edit, Trash2, Eye, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Product } from "@/types/products";
import CreateProductModal from "@/components/admin/products/create-product-modal";
import EditProductModal from "@/components/admin/products/edit-product-modal";
import DeleteProductModal from "@/components/admin/products/delete-product-modal";
import CreateVariantModal from "@/components/admin/variants/create-variant-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Category } from "@/types/category";
import { Label } from "@/components/ui/label";
import Image from "next/image";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<Category[]>([]);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Define filterProducts with useCallback
  const filterProducts = useCallback(() => {
    let filtered = products;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          product.subcategory?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.categoryId?.toString() === selectedCategory
      );
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory]); // Add dependencies

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [filterProducts]); // Add filterProducts as dependency

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/products?limit=300");
      if (data.success) {
        setProducts(data.data);
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(err.response?.data?.message || "Failed to fetch products");
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  // In your products page component
  const fetchCategories = async () => {
    try {
      const { data } = await axios.get(
        "/api/categories?forAdmin=true&limit=100"
      );
      console.log("Categories API Response:", data);
      if (data.success) {
        setCategories(data.data);
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(
          err.response?.data?.message || "Failed to fetch categories"
        );
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const handleAddVariant = (product: Product) => {
    setSelectedProduct(product);
    setShowVariantModal(true);
  };

  const handleViewVariants = (productId: number) => {
    window.location.href = `/admin/variants?productId=${productId}`;
  };

  // Safe accessor functions
  const getShowerTypeName = (product: Product) => {
    return product.category?.showerType?.name || "No Shower Type";
  };

  const getCategoryName = (product: Product) => {
    return product.category?.name || "No Category";
  };

  const getSubcategoryName = (product: Product) => {
    return product.subcategory?.name || null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-1 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Products Management</h1>
          <p className="text-muted-foreground">
            Manage your products and variants
          </p>
        </div>
        <Button
          className="cursor-pointer"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Search Products</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Filter by Category</Label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id.toString()}
                    >
                      <div className="flex items-center gap-2">
                        <span>{category.name}</span>
                        {category.showerType && (
                          <Badge variant="outline" className="text-xs ml-2">
                            {category.showerType.name}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Statistics</Label>
              <div className="text-sm text-muted-foreground">
                Showing {filteredProducts.length} of {products.length} products
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">
                  {product.name || "Unnamed Product"}
                </CardTitle>
                <Badge variant="secondary">
                  {product._count?.variants || 0} variants
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {getShowerTypeName(product)} → {getCategoryName(product)}
                {getSubcategoryName(product) &&
                  ` → ${getSubcategoryName(product)}`}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {product.thumbnailUrl && (
                <div className="relative w-full h-48 overflow-hidden rounded-lg bg-gray-50">
                  <Image
                    src={product.thumbnailUrl}
                    alt={product.name || "Product image"}
                    fill
                    className="object-contain"
                    quality={100}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {product.description || "No description available"}
                </p>
                <div className="flex flex-wrap gap-1">
                  {(product.variants || []).slice(0, 3).map((variant) => (
                    <Badge
                      key={variant.id}
                      variant="outline"
                      className="text-xs"
                    >
                      {variant.colorName}
                    </Badge>
                  ))}
                  {product.variants && product.variants.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{product.variants.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleViewVariants(product.id)}
                  className="flex-1 cursor-pointer"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 cursor-pointer"
                  onClick={() => handleAddVariant(product)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(product)}
                  className="flex-1 cursor-pointer"
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(product)}
                  className="flex-1 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground">
              {products.length === 0 ? (
                <>
                  <p className="text-lg font-medium">No products found</p>
                  <p className="mt-2">
                    Get started by creating your first product
                  </p>
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 cursor-pointer"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Product
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium">No matching products</p>
                  <p className="mt-2">Try adjusting your search or filters</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <CreateProductModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onProductCreated={() => {
          fetchProducts();
          setShowCreateModal(false);
        }}
        categories={categories}
      />

      {selectedProduct && (
        <>
          <EditProductModal
            open={showEditModal}
            onClose={() => setShowEditModal(false)}
            product={selectedProduct}
            onProductUpdated={() => {
              fetchProducts();
              setShowEditModal(false);
            }}
            categories={categories}
          />

          <DeleteProductModal
            open={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            product={selectedProduct}
            onProductDeleted={() => {
              fetchProducts();
              setShowDeleteModal(false);
            }}
          />

          <CreateVariantModal
            open={showVariantModal}
            onClose={() => setShowVariantModal(false)}
            product={selectedProduct}
            onVariantCreated={() => {
              fetchProducts();
              setShowVariantModal(false);
            }}
          />
        </>
      )}
    </div>
  );
}
