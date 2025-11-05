// src/components/admin/subcategories/subcategories-page.tsx
"use client";

import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { FolderTree, Folder, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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

import type { Subcategory, SubcategoryListResponse } from "@/types/subcategory";
import CreateSubcategoryModal from "./create-subcategory-modal";
import EditSubcategoryModal from "./edit-subcategory-modal";
import DeleteSubcategoryModal from "./delete-subcategory-modal";
import { Product } from "@/types/category";

export default function SubcategoriesPage() {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchSubcategories = async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get<SubcategoryListResponse>(
        `/api/subcategories?forAdmin=true&page=${page}&limit=6`
      );

      if (!data.success) throw new Error(data.message);

      setSubcategories(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError(
          err.response?.data?.message || "Failed to fetch subcategories"
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to fetch subcategories");
      }
      toast.error("Failed to fetch subcategories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubcategories(page);
  }, [page]);

  const handleSubcategoryCreated = (newSubcategory: Subcategory) => {
    setSubcategories((prev) => [newSubcategory, ...prev]);
    setPage(1);
  };

  const handleSubcategoryUpdated = (updatedSubcategory: Subcategory) => {
    setSubcategories((prev) =>
      prev.map((sc) =>
        sc.id === updatedSubcategory.id ? updatedSubcategory : sc
      )
    );
  };

  const handleSubcategoryDeleted = (id: number) => {
    setSubcategories((prev) => prev.filter((sc) => sc.id !== id));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Subcategories
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage subcategories for your configurator
          </p>
        </div>
        <CreateSubcategoryModal
          onSubcategoryCreated={handleSubcategoryCreated}
        />
      </div>

      <Separator />

      {/* Error State */}
      {error && (
        <div className="p-4 border border-destructive/50 rounded-md bg-destructive/10">
          <p className="text-destructive">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => fetchSubcategories(page)}
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
      ) : subcategories.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <FolderTree className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No subcategories found</h3>
          <p className="text-muted-foreground mb-4">
            Get started by creating your first subcategory
          </p>
          <CreateSubcategoryModal
            onSubcategoryCreated={handleSubcategoryCreated}
          />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {subcategories.map((subcategory) => (
            <Card
              key={subcategory.id}
              className="shadow-sm border overflow-hidden"
            >
              <CardHeader className="flex flex-row items-center justify-between bg-muted/50 p-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FolderTree className="h-5 w-5 text-primary" />
                  {subcategory.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <EditSubcategoryModal
                    subcategory={subcategory}
                    onSubcategoryUpdated={handleSubcategoryUpdated}
                  />
                  <DeleteSubcategoryModal
                    subcategoryId={subcategory.id}
                    subcategoryName={subcategory.name}
                    onSubcategoryDeleted={handleSubcategoryDeleted}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="mb-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Slug</span>
                    <Badge variant="secondary">{subcategory.slug}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Z-Index</span>
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <Layers className="h-3 w-3" />
                      {subcategory.z_index ?? "Not set"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Category</span>
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <Folder className="h-3 w-3" />
                      {subcategory.category.name}
                    </Badge>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Products</span>
                  <Badge variant="outline">
                    {subcategory._count.products} products
                  </Badge>
                </div>

                {subcategory.products && subcategory.products.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {subcategory.products
                      .slice(0, 3)
                      .map((product: Product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between text-xs p-1 bg-muted/30 rounded"
                        >
                          <div className="flex items-center gap-1">
                            <span>{product.name}</span>
                            {product.z_index && (
                              <Badge variant="secondary" className="text-xs">
                                Z: {product.z_index}
                              </Badge>
                            )}
                          </div>
                          <Badge variant="secondary">
                            {product._count?.variants || 0} variants
                          </Badge>
                        </div>
                      ))}
                    {subcategory.products.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center mt-1">
                        +{subcategory.products.length - 3} more products
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
