"use client";

import { Plus, Pencil, Trash2, Palette, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function ColorsPage() {
  // Mock data
  const colors = [
    {
      id: "c1",
      name: "White",
      hex: "#ffffff",
      asset: { id: "a1", name: "Marble Tile" },
    },
    {
      id: "c2",
      name: "Black",
      hex: "#000000",
      asset: { id: "a1", name: "Marble Tile" },
    },
    {
      id: "c3",
      name: "Red",
      hex: "#ff0000",
      asset: { id: "a3", name: "Oil Paint" },
    },
    {
      id: "c4",
      name: "Blue",
      hex: "#0000ff",
      asset: { id: "a3", name: "Oil Paint" },
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Color Variants
        </h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Color Variant
        </Button>
      </div>

      <Separator />

      {/* Colors List */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {colors.map((color) => (
          <Card key={color.id} className="shadow-sm border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex flex-col text-lg">
                <span className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  {color.name}
                </span>
                <span className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  {color.asset.name}
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
              {/* Swatch Preview */}
              <div
                className="w-full h-12 rounded-md border"
                style={{ backgroundColor: color.hex }}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
