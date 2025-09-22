"use client";

import { Plus, Pencil, Trash2, Package, FolderTree } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function AssetsPage() {
  // Mock data
  const assets = [
    {
      id: "a1",
      name: "Marble Tile",
      subcategory: { id: "1-1", name: "Tiles" },
      category: { id: "1", name: "Walls" },
      colors: [
        { id: "c1", name: "White" },
        { id: "c2", name: "Black" },
      ],
    },
    {
      id: "a2",
      name: "Granite Tile",
      subcategory: { id: "1-1", name: "Tiles" },
      category: { id: "1", name: "Walls" },
      colors: [],
    },
    {
      id: "a3",
      name: "Oil Paint",
      subcategory: { id: "1-2", name: "Paints" },
      category: { id: "1", name: "Walls" },
      colors: [
        { id: "c3", name: "Red" },
        { id: "c4", name: "Blue" },
      ],
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Assets</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Asset
        </Button>
      </div>

      <Separator />

      {/* Assets */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {assets.map((asset) => (
          <Card key={asset.id} className="shadow-sm border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex flex-col text-lg">
                <span className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  {asset.name}
                </span>
                <span className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                  <FolderTree className="h-4 w-4 text-muted-foreground" />
                  {asset.subcategory.name} / {asset.category.name}
                </span>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="outline">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {asset.colors.length > 0 ? (
                <ul className="space-y-2">
                  {asset.colors.map((color) => (
                    <li
                      key={color.id}
                      className="flex items-center justify-between rounded-md bg-muted/50 p-2"
                    >
                      <span>{color.name}</span>
                      <div className="flex gap-2">
                        <Button size="icon" variant="outline">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No color variants
                </p>
              )}
              <Button variant="ghost" size="sm" className="mt-3 text-primary">
                <Plus className="h-4 w-4 mr-1" />
                Add Color Variant
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
