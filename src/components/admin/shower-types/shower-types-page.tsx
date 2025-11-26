// src/components/admin/shower-types/shower-types-page.tsx
"use client";

import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { ShowerHead, Building, ImageIcon } from "lucide-react";
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
import Image from "next/image";

import type { ShowerType } from "@/types/shower-types";
import CreateShowerTypeModal from "./create-shower-type-modal";
import EditShowerTypeModal from "./edit-shower-type-modal";
import DeleteShowerTypeModal from "./delete-shower-type-modal";

interface ShowerTypeListResponse {
  message: string | undefined;
  success: boolean;
  data: ShowerType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function ShowerTypesPage() {
  const [showerTypes, setShowerTypes] = useState<ShowerType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchShowerTypes = async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get<ShowerTypeListResponse>(
        `/api/shower-types?page=${page}&limit=6`
      );

      if (!data.success) throw new Error(data.message);

      setShowerTypes(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to fetch shower types");
        toast.error(
          err.response?.data?.message || "Failed to fetch shower types"
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to fetch shower types");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShowerTypes(page);
  }, [page]);

  const handleShowerTypeCreated = (newShowerType: ShowerType) => {
    setShowerTypes((prev) => [newShowerType, ...prev]);
    setPage(1); // Reset to first page when a new shower type is added
  };

  const handleShowerTypeUpdated = (updatedShowerType: ShowerType) => {
    setShowerTypes((prev) =>
      prev.map((st) =>
        st.id === updatedShowerType.id ? updatedShowerType : st
      )
    );
  };

  const handleShowerTypeDeleted = (id: number) => {
    setShowerTypes((prev) => prev.filter((st) => st.id !== id));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Shower Types
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage shower types for your configurator
          </p>
        </div>
        <CreateShowerTypeModal onShowerTypeCreated={handleShowerTypeCreated} />
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
            onClick={() => fetchShowerTypes(page)}
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
      ) : showerTypes.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <ShowerHead className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No shower types found</h3>
          <p className="text-muted-foreground mb-4">
            Get started by creating your first shower type
          </p>
          <CreateShowerTypeModal
            onShowerTypeCreated={handleShowerTypeCreated}
          />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {showerTypes.map((showerType) => (
            <Card
              key={showerType.id}
              className="shadow-sm border overflow-hidden"
            >
              <CardHeader className="flex flex-row items-center justify-between bg-muted/50 p-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShowerHead className="h-5 w-5 text-primary" />
                  {showerType.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <EditShowerTypeModal
                    showerType={showerType}
                    onShowerTypeUpdated={handleShowerTypeUpdated}
                  />
                  <DeleteShowerTypeModal
                    showerTypeId={showerType.id}
                    showerTypeName={showerType.name}
                    onShowerTypeDeleted={handleShowerTypeDeleted}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {/* Image Thumbnail */}
                {showerType.imageUrl ? (
                  <div className="mb-4 relative w-full h-40 rounded-md overflow-hidden bg-muted">
                    <Image
                      src={showerType.imageUrl}
                      alt={showerType.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                ) : (
                  <div className="mb-4 w-full h-40 rounded-md bg-muted flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                )}

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Project Type</span>
                    <Badge variant="outline">
                      <Building className="h-3 w-3 mr-1" />
                      {showerType.projectType.name}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Slug</span>
                    <Badge variant="secondary">{showerType.slug}</Badge>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Categories</span>
                  <Badge variant="outline">
                    {showerType._count.categories} categories
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-muted-foreground">User Designs</span>
                  <Badge variant="outline">
                    {showerType._count.UserDesign} designs
                  </Badge>
                </div>

                {showerType.baseImage && (
                  <>
                    <Separator className="my-4" />
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        Base Image:{" "}
                      </span>
                      <a
                        href={showerType.baseImage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        View
                      </a>
                    </div>
                  </>
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
