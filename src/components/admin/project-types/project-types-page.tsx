// src/components/admin/project-types/project-types-page.tsx
"use client";

import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { FolderTree, Building } from "lucide-react";
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

import type {
  ProjectType,
  ProjectTypeListResponse,
} from "@/types/project-type";
import CreateProjectTypeModal from "./create-project-type-modal";
import EditProjectTypeModal from "./edit-project-type-modal";
import DeleteProjectTypeModal from "./delete-project-type-modal";

export default function ProjectTypesPage() {
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProjectTypes = async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get<ProjectTypeListResponse>(
        `/api/project-types?page=${page}&limit=6`
      );

      if (!data.success) throw new Error(data.message);

      setProjectTypes(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError(
          err.response?.data?.message || "Failed to fetch project types"
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to fetch project types");
      }
      toast.error("Failed to fetch project types");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectTypes(page);
  }, [page]);

  const handleProjectTypeCreated = (newProjectType: ProjectType) => {
    setProjectTypes((prev) => [newProjectType, ...prev]);
    setPage(1); // Reset to first page when a new project type is added
  };

  const handleProjectTypeUpdated = (updatedProjectType: ProjectType) => {
    setProjectTypes((prev) =>
      prev.map((pt) =>
        pt.id === updatedProjectType.id ? updatedProjectType : pt
      )
    );
  };

  const handleProjectTypeDeleted = (id: number) => {
    setProjectTypes((prev) => prev.filter((pt) => pt.id !== id));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Project Types
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage project types for your configurator
          </p>
        </div>
        <CreateProjectTypeModal
          onProjectTypeCreated={handleProjectTypeCreated}
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
            className="mt-2 cursor-pointer"
            onClick={() => fetchProjectTypes(page)}
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
      ) : projectTypes.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No project types found</h3>
          <p className="text-muted-foreground mb-4">
            Get started by creating your first project type
          </p>
          <CreateProjectTypeModal
            onProjectTypeCreated={handleProjectTypeCreated}
          />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projectTypes.map((projectType) => (
            <Card
              key={projectType.id}
              className="shadow-sm border overflow-hidden"
            >
              <CardHeader className="flex flex-row items-center justify-between bg-muted/50 p-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building className="h-5 w-5 text-primary" />
                  {projectType.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <EditProjectTypeModal
                    projectType={projectType}
                    onProjectTypeUpdated={handleProjectTypeUpdated}
                  />
                  <DeleteProjectTypeModal
                    projectTypeId={projectType.id}
                    projectTypeName={projectType.name}
                    onProjectTypeDeleted={handleProjectTypeDeleted}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Slug</span>
                    <Badge variant="secondary">{projectType.slug}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Shower Types</span>
                    <Badge variant="outline">
                      {projectType._count.showerTypes} types
                    </Badge>
                  </div>
                </div>

                <Separator className="my-4" />

                {projectType.showerTypes &&
                  projectType.showerTypes.length > 0 && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        Shower Types:
                      </span>
                      <div className="mt-2 space-y-1">
                        {projectType.showerTypes
                          .slice(0, 3)
                          .map((showerType: any) => (
                            <div
                              key={showerType.id}
                              className="flex items-center justify-between text-xs p-1 bg-muted/30 rounded"
                            >
                              <span className="flex items-center gap-1">
                                <FolderTree className="h-3 w-3" />
                                {showerType.name}
                              </span>
                              <Badge variant="secondary">
                                {showerType._count?.categories || 0} categories
                              </Badge>
                            </div>
                          ))}
                        {projectType.showerTypes.length > 3 && (
                          <div className="text-xs text-muted-foreground text-center mt-1">
                            +{projectType.showerTypes.length - 3} more shower
                            types
                          </div>
                        )}
                      </div>
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
