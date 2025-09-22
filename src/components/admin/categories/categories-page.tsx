// app/categories/page.tsx
"use client";

import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { Pencil, Trash2, Folder, FolderTree, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import type { Category, CategoryResponse } from "@/types/category";
import CategoryModal from "./create-category-modal";
import EditCategoryModal from "./edit-category-modal";
import DeleteCategoryModal from "./delete-category-modal";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ✅ Fetch categories
  const fetchCategories = async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get<CategoryResponse>(
        `/api/categories?page=${page}&limit=6`
      );

      if (!data.success) throw new Error(data.message);

      setCategories(data.data);
      setTotalPages(data.pagination.totalPages);
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

  useEffect(() => {
    fetchCategories(page);
  }, [page]);

  const handleCategoryCreated = (newCategory: Category) => {
    setCategories((prev) => [newCategory, ...prev]);
    setPage(1); // Reset to first page when a new category is added
  };

  const handleCategoryUpdated = (updatedCategory: Category) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === updatedCategory.id ? updatedCategory : c))
    );
  };

  const handleCategoryDeleted = (id: number) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Manage product categories for your shower configurator
          </p>
        </div>
        <CategoryModal onCategoryCreated={handleCategoryCreated} />
      </div>

      <Separator />

      {/* Error State */}
      {error && (
        <div className="p-4 border border-destructive/50 rounded-md bg-destructive/10">
          <p className="text-destructive">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 cursor-pointer"
            onClick={() => fetchCategories(page)}
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="shadow-sm border p-4 space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </Card>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No categories found</h3>
          <p className="text-muted-foreground mb-4">
            Get started by creating your first category
          </p>
          <CategoryModal onCategoryCreated={handleCategoryCreated} />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Card key={cat.id} className="shadow-sm border overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between bg-muted/50 p-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Folder className="h-5 w-5 text-primary" />
                  {cat.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <EditCategoryModal
                    category={cat}
                    onCategoryUpdated={handleCategoryUpdated}
                  />
                  <DeleteCategoryModal
                    categoryId={cat.id}
                    categoryName={cat.name}
                    onCategoryDeleted={handleCategoryDeleted}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Shower Type</span>
                    <Badge variant="outline">{cat.showerType.name}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Has Subcategories
                    </span>
                    <Badge
                      variant={cat.hasSubcategories ? "default" : "secondary"}
                    >
                      {cat.hasSubcategories ? "Yes" : "No"}
                    </Badge>
                  </div>
                </div>

                <Separator className="my-4" />

                {cat.hasSubcategories && cat.subcategories.length > 0 ? (
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="subcategories">
                      <AccordionTrigger className="text-sm py-2">
                        <span className="flex items-center gap-2">
                          <FolderTree className="h-4 w-4 text-muted-foreground" />
                          Subcategories ({cat._count.subcategories})
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2">
                          {cat.subcategories.map((sub) => (
                            <li
                              key={sub.id}
                              className="flex items-center justify-between rounded-md bg-muted/50 p-2 text-sm"
                            >
                              <span>{sub.name}</span>
                              <Badge variant="outline">
                                {sub._count.products} products
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ) : (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    {cat.hasSubcategories
                      ? "No subcategories"
                      : "No subcategories enabled"}
                  </div>
                )}

                <Separator className="my-4" />

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Direct Products</span>
                  <Badge variant="outline">
                    {cat._count.products} products
                  </Badge>
                </div>

                {cat.products?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {cat.products.slice(0, 3).map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between text-xs p-1 bg-muted/30 rounded"
                      >
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {product.name}
                        </span>
                        <Badge variant="secondary">
                          {product._count.variants} variants
                        </Badge>
                      </div>
                    ))}
                    {cat.products.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center mt-1">
                        +{cat.products.length - 3} more products
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 1) setPage(page - 1);
                  }}
                  className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    href="#"
                    isActive={page === i + 1}
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(i + 1);
                    }}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page < totalPages) setPage(page + 1);
                  }}
                  className={
                    page >= totalPages ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
