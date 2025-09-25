// app/configure-shower/project-type/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Droplets, FolderOpen, ArrowRight, Loader2 } from "lucide-react";
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
import { ProjectType } from "@/types/shower-config";
import axios from "axios";
import { updateConfig } from "@/utils/SessionConfig";

export default function ProjectTypePage() {
  const router = useRouter();
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjectTypes();
  }, []);

  const fetchProjectTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axios.get<{
        success: boolean;
        data: ProjectType[];
        message?: string;
      }>("/api/project-types?limit=10");

      if (data.success) {
        setProjectTypes(data.data);
      } else {
        throw new Error(data.message || "Failed to load project types");
      }
    } catch (err: unknown) {
      console.error("Error fetching project types:", err);
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "An error occurred while fetching project types"
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

  const handleTypeSelect = (projectType: {
    id: number;
    name: string;
    slug: string;
  }) => {
    updateConfig({
      projectTypeId: projectType.id,
      projectTypeName: projectType.name,
    });
    if (projectType.slug === "shower") router.push("/shower-type");
    else if (projectType.slug === "existing") router.push("/load-project");
    else router.push("/shower-type");
  };

  const defaultProjectTypes: ProjectType[] = [
    {
      id: 1,
      name: "Showers",
      slug: "shower",
      description: "Create your ideal shower space",
      baseImage: "/images/shower.png",
    },
    {
      id: 2,
      name: "Load Existing Project",
      slug: "existing",
      description: "Continue working on a saved design",
      baseImage: "/images/existing-project.jpg",
    },
  ];

  const displayTypes =
    projectTypes.length > 0 ? projectTypes : defaultProjectTypes;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading project types...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive mb-4">Error: {error}</p>
          <Button onClick={fetchProjectTypes}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Let&apos;s begin by choosing your project type
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            or by loading an existing one
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {displayTypes.map((projectType, index) => (
            <motion.div
              key={projectType.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card
                onClick={() => handleTypeSelect(projectType)}
                className="cursor-pointer group overflow-hidden border hover:shadow-lg transition-all duration-300 h-full flex flex-col"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden">
                  <Image
                    src={
                      projectType.baseImage || `/images/${projectType.slug}.png`
                    }
                    alt={projectType.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 400px"
                    priority={index === 0}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <CardHeader className="text-center flex-grow">
                  <div className="w-16 h-16 bg-primary/10 group-hover:bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors duration-300">
                    {projectType.slug === "shower" ? (
                      <Droplets className="w-8 h-8 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                    ) : (
                      <FolderOpen className="w-8 h-8 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                    )}
                  </div>
                  <CardTitle className="text-2xl group-hover:text-primary transition-colors duration-300">
                    {projectType.name}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {projectType.description}
                  </CardDescription>
                </CardHeader>

                <CardFooter className="justify-center pb-6 mt-auto">
                  <Button
                    variant="link"
                    className="text-primary group-hover:text-primary/80 cursor-pointer p-0"
                  >
                    Get Started
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
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
