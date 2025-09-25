// app/plumbing-config/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2, Wrench } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlumbingConfig } from "@/types/shower-config";

interface SessionConfig {
  projectTypeName?: string;
  showerTypeName?: string;
  showerTypeId?: number;
  projectTypeId?: number;
}

export default function PlumbingConfigPage() {
  const router = useRouter();
  const [selectedConfig, setSelectedConfig] = useState<string | null>(null);
  const [configuration, setConfiguration] = useState<SessionConfig | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>(
    {}
  );

  const loadConfiguration = useCallback(() => {
    try {
      const config = sessionStorage.getItem("showerConfig");
      if (config) {
        const parsed: SessionConfig = JSON.parse(config);
        setConfiguration(parsed);

        if (!parsed.showerTypeId) {
          router.push("/shower-type");
          return;
        }
      } else {
        router.push("/project-type");
      }
    } catch (err) {
      console.error("Error loading configuration:", err);
      router.push("/project-type");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadConfiguration();
  }, [loadConfiguration]);

  const plumbingConfigs: PlumbingConfig[] = [
    {
      id: "right",
      name: "Right Plumbing",
      description: "Plumbing fixtures on the right side",
      image: "/images/right.png",
    },
    {
      id: "left",
      name: "Left Plumbing",
      description: "Plumbing fixtures on the left side",
      image: "/images/left.png",
    },
  ];

  const handleConfigSelect = (configId: string) => {
    setSelectedConfig(configId);
  };

  const handleImageError = (imageUrl: string) => {
    setImageErrors((prev) => ({ ...prev, [imageUrl]: true }));
  };

  const handleContinue = () => {
    if (!selectedConfig) return;

    try {
      const existingConfig = sessionStorage.getItem("showerConfig");
      const config: SessionConfig = existingConfig
        ? JSON.parse(existingConfig)
        : {};

      const updatedConfig = {
        ...config,
        plumbingConfig: selectedConfig,
      };

      sessionStorage.setItem("showerConfig", JSON.stringify(updatedConfig));
      router.push("/design");
    } catch (err) {
      console.error("Error saving configuration:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 bg-background">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()} // More flexible back navigation
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
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Plumbing Configuration
          </h1>
          <p className="text-xl text-muted-foreground">
            Select the plumbing configuration for your shower
          </p>

          {configuration && (
            <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              {configuration.projectTypeName && (
                <span>Project: {configuration.projectTypeName}</span>
              )}
              {configuration.showerTypeName && (
                <span>Shower: {configuration.showerTypeName}</span>
              )}
            </div>
          )}
        </motion.div>

        {/* Plumbing Config Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {plumbingConfigs.map((config, index) => (
            <motion.div
              key={config.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card
                onClick={() => handleConfigSelect(config.id)}
                className={`cursor-pointer group overflow-hidden border-2 transition-all duration-300 h-full ${
                  selectedConfig === config.id
                    ? "border-primary shadow-lg"
                    : "border-transparent hover:border-gray-300"
                }`}
              >
                <CardContent className="p-0">
                  <div className="relative aspect-[3/4] w-full overflow-hidden">
                    <Image
                      src={
                        imageErrors[config.image]
                          ? "/images/placeholder.png"
                          : config.image
                      }
                      alt={config.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      onError={() => handleImageError(config.image)}
                    />
                    {selectedConfig === config.id && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <h3 className="font-semibold text-lg">{config.name}</h3>
                      <p className="text-sm opacity-90">{config.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center"
        >
          <Button
            onClick={handleContinue}
            disabled={!selectedConfig}
            size="lg"
            className="min-w-[200px] cursor-pointer"
          >
            <Wrench className="h-5 w-5 mr-2" />
            Continue to Design
            <ArrowLeft className="ml-2 h-5 w-5 rotate-180" />
          </Button>

          {!selectedConfig && (
            <p className="text-sm text-muted-foreground mt-2">
              Please select a plumbing configuration to continue
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
