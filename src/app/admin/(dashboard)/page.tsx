"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, FolderTree, Palette, ShowerHead, Network, LayoutTemplate } from "lucide-react";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface DashboardStats {
  projectTypes: number;
  showerTypes: number;
  categories: number;
  subcategories: number;
  products: number;
  variants: number;
  templates: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    projectTypes: 0,
    showerTypes: 0,
    categories: 0,
    subcategories: 0,
    products: 0,
    variants: 0,
    templates: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // Fetch counts from various endpoints
      const [
        projectTypesRes,
        showerTypesRes,
        categoriesRes,
        subcategoriesRes,
        productsRes,
        templatesRes,
      ] = await Promise.all([
        axios.get("/api/project-types?limit=1"),
        axios.get("/api/shower-types?limit=1"),
        axios.get("/api/categories?limit=1&forAdmin=true"),
        axios.get("/api/subcategories?limit=1&forAdmin=true"),
        axios.get("/api/products?limit=1"),
        axios.get("/api/template-categories?limit=1"),
      ]);

      setStats({
        projectTypes: projectTypesRes.data.pagination?.total || 0,
        showerTypes: showerTypesRes.data.pagination?.total || 0,
        categories: categoriesRes.data.pagination?.total || 0,
        subcategories: subcategoriesRes.data.pagination?.total || 0,
        products: productsRes.data.pagination?.total || 0,
        variants: 0, // We'll calculate this from products if needed
        templates: templatesRes.data.pagination?.total || 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: "Project Types",
      value: stats.projectTypes,
      description: "Total project types",
      icon: Network,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Shower Types",
      value: stats.showerTypes,
      description: "Total shower configurations",
      icon: ShowerHead,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      title: "Templates",
      value: stats.templates,
      description: "Template categories",
      icon: LayoutTemplate,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
    {
      title: "Categories",
      value: stats.categories,
      description: "Product categories",
      icon: FolderTree,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Subcategories",
      value: stats.subcategories,
      description: "Product subcategories",
      icon: FolderTree,
      color: "text-teal-600",
      bgColor: "bg-teal-100 dark:bg-teal-900/20",
    },
    {
      title: "Products",
      value: stats.products,
      description: "Total products",
      icon: Package,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100 dark:bg-indigo-900/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to the Bath Fitter Admin Panel
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[60px] mb-2" />
                <Skeleton className="h-3 w-[120px]" />
              </CardContent>
            </Card>
          ))
        ) : (
          // Actual stats cards
          statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/admin/project-types"
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <Network className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Manage Project Types</p>
                <p className="text-sm text-muted-foreground">
                  Add or edit project types
                </p>
              </div>
            </Link>
            <Link
              href="/admin/shower-types"
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <ShowerHead className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium">Manage Shower Types</p>
                <p className="text-sm text-muted-foreground">
                  Configure shower options
                </p>
              </div>
            </Link>
            <Link
              href="/admin/templates"
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <LayoutTemplate className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium">Manage Templates</p>
                <p className="text-sm text-muted-foreground">
                  Edit template categories
                </p>
              </div>
            </Link>
            <Link
              href="/admin/categories"
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <FolderTree className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Manage Categories</p>
                <p className="text-sm text-muted-foreground">
                  Organize product categories
                </p>
              </div>
            </Link>
            <Link
              href="/admin/products"
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <Package className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="font-medium">Manage Products</p>
                <p className="text-sm text-muted-foreground">
                  Add or edit products
                </p>
              </div>
            </Link>
            <Link
              href="/admin/variants"
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <Palette className="h-5 w-5 text-pink-600" />
              <div>
                <p className="font-medium">Manage Variants</p>
                <p className="text-sm text-muted-foreground">
                  Product color variants
                </p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
