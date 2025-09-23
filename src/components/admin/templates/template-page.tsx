// app/templates/page.tsx
"use client";

import { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import { FolderTree, FileStack } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

import CreateTemplateModal from "./category/create-template-modal";
import EditTemplateModal from "./category/edit-template-modal";
import DeleteTemplateModal from "./category/delete-template-modal";
import InstantiateTemplateModal from "./instantiate-template-modal";
import Link from "next/link";

interface TemplateCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  _count: {
    templateSubcategories: number;
    templateProducts: number;
    categories: number;
  };
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get("/api/template-categories");
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to fetch templates");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to fetch templates");
      }
      toast.error("Failed to fetch templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleTemplateCreated = (newTemplate: TemplateCategory) => {
    setTemplates((prev) => [newTemplate, ...prev]);
  };

  const handleTemplateUpdated = (updatedTemplate: TemplateCategory) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t))
    );
  };

  const handleTemplateDeleted = (id: number) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Template Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Create and manage templates for easy category duplication across
            shower types
          </p>
        </div>
        <CreateTemplateModal onTemplateCreated={handleTemplateCreated} />
      </div>

      <Separator />

      {error && (
        <div className="p-4 border border-destructive/50 rounded-md bg-destructive/10">
          <p className="text-destructive">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 cursor-pointer"
            onClick={fetchTemplates}
          >
            Try Again
          </Button>
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </Card>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <FileStack className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No templates found</h3>
          <p className="text-muted-foreground mb-4">
            Get started by creating your first template
          </p>
          <CreateTemplateModal onTemplateCreated={handleTemplateCreated} />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="overflow-hidden">
              <CardHeader className="bg-muted/50 p-4">
                <CardTitle className="flex items-center justify-between">
                  <Link
                    href={`/admin/templates/${template.id}`}
                    className="flex items-center gap-2 hover:underline"
                  >
                    <FolderTree className="h-5 w-5 text-primary" />
                    <span>{template.name}</span>
                  </Link>
                  <div className="flex items-center gap-1">
                    <EditTemplateModal
                      template={template}
                      onTemplateUpdated={handleTemplateUpdated}
                    />
                    <DeleteTemplateModal
                      templateId={template.id}
                      templateName={template.name}
                      onTemplateDeleted={handleTemplateDeleted}
                    />
                  </div>
                </CardTitle>
                {template.description && (
                  <p className="text-sm text-muted-foreground">
                    {template.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subcategories</span>
                    <Badge variant="outline">
                      {template._count.templateSubcategories}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Products</span>
                    <Badge variant="outline">
                      {template._count.templateProducts}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Instances</span>
                    <Badge>{template._count.categories}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Slug</span>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {template.slug}
                    </Badge>
                  </div>
                </div>

                <InstantiateTemplateModal
                  templateId={template.id}
                  templateName={template.name}
                  onInstantiated={fetchTemplates}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
