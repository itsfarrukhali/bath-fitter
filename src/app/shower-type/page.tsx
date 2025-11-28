// app/configure-shower/shower-type/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, ShowerHead } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShowerType } from "@/types/shower-config";
import axios from "axios";

export default function ShowerTypePage() {
  const router = useRouter();
  const [showerTypes, setShowerTypes] = useState<ShowerType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjectType, setSelectedProjectType] = useState<{
    id: number;
    name: string;
  } | null>(null);

  useEffect(() => {
    loadConfiguration();
    fetchShowerTypes();
  }, []);

  const loadConfiguration = () => {
    try {
      const config = sessionStorage.getItem("showerConfig");
      if (config) {
        const parsed = JSON.parse(config);
        setSelectedProjectType({
          id: parsed.projectTypeId,
          name: parsed.projectTypeName,
        });
      }
    } catch (err) {
      console.error("Error loading configuration:", err);
    }
  };

  const fetchShowerTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axios.get<{
        success: boolean;
        data: ShowerType[];
        message?: string;
      }>("/api/shower-types?limit=20");

      if (data.success) {
        setShowerTypes(data.data);
      } else {
        throw new Error(data.message || "Failed to load shower types");
      }
    } catch (err) {
      console.error("Error fetching shower types:", err);
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "An error occurred while fetching shower types"
        );
      } else {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShowerTypeSelect = (showerType: ShowerType) => {
    // Update configuration in sessionStorage
    try {
      const existingConfig = sessionStorage.getItem("showerConfig");
      const config = existingConfig ? JSON.parse(existingConfig) : {};

      sessionStorage.setItem(
        "showerConfig",
        JSON.stringify({
          ...config,
          showerTypeId: showerType.id,
          showerTypeName: showerType.name,
          showerTypeSlug: showerType.slug,
        })
      );
    } catch (err) {
      console.error("Error saving configuration:", err);
    }

    router.push("/plumbing-config");
  };

  const defaultShowerTypes: ShowerType[] = [
    {
      id: 1,
      name: "Tub to Shower",
      slug: "tub-to-shower",
      description: "Convert your bathtub into a spacious shower",
      imageUrl: "/images/tub-to-shower.png",
      projectTypeId: 1,
      projectType: { id: 1, name: "Showers", slug: "shower" },
    },
    {
      id: 2,
      name: "Curved Shower",
      slug: "curved",
      description: "Elegant curved design for modern bathrooms",
      imageUrl: "/images/curved.png",
      projectTypeId: 1,
      projectType: { id: 1, name: "Showers", slug: "shower" },
    },
    {
      id: 3,
      name: "Alcove Shower",
      slug: "alcove",
      description: "Space-efficient three-wall enclosure",
      imageUrl: "/images/alcove.png",
      projectTypeId: 1,
      projectType: { id: 1, name: "Showers", slug: "shower" },
    },
    {
      id: 4,
      name: "Neo Angle",
      slug: "neo-angle",
      description: "Space-efficient three-wall enclosure",
      imageUrl: "/images/neo-angle.png",
      projectTypeId: 1,
      projectType: { id: 1, name: "Showers", slug: "shower" },
    },
  ];

  const displayShowerTypes =
    showerTypes.length > 0 ? showerTypes : defaultShowerTypes;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading shower types...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive mb-4">Error: {error}</p>
          <Button onClick={fetchShowerTypes}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/configure-shower/project-type")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your Shower Type
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Select the shower configuration that best fits your space
          </p>
          {selectedProjectType && (
            <p className="text-lg text-primary mt-2">
              Project: {selectedProjectType.name}
            </p>
          )}
        </motion.div>

        {/* Shower Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayShowerTypes.map((showerType, index) => (
            <motion.div
              key={showerType.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card
                onClick={() => handleShowerTypeSelect(showerType)}
                className="cursor-pointer group overflow-hidden border hover:shadow-lg transition-all duration-300 h-full flex flex-col"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden">
                  <Image
                    src={
                      showerType.imageUrl || `/images/${showerType.slug}.png`
                    }
                    alt={showerType.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <CardHeader className="text-center flex-grow">
                  <div className="w-12 h-12 bg-primary/10 group-hover:bg-primary rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors duration-300">
                    <ShowerHead className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors duration-300">
                    {showerType.name}
                  </CardTitle>
                  <CardDescription className="text-sm mt-1 line-clamp-2">
                    {showerType.description}
                  </CardDescription>
                </CardHeader>

                <CardFooter className="justify-center pb-4 mt-auto">
                  <Button
                    variant="link"
                    className="text-primary group-hover:text-primary/80 cursor-pointer p-0 text-sm"
                  >
                    Select
                    <ArrowLeft className="ml-1 w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300 rotate-180" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
