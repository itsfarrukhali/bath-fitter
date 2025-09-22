"use client";

import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";

// ShadCN imports
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PlumbingConfig() {
  const [selectedSide, setSelectedSide] = useState<string | null>(null);
  const [projectType, setProjectType] = useState("shower");
  const [showerShape, setShowerShape] = useState("");
  const router = useRouter();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get("type") || "shower";
    const shape = urlParams.get("shape") || "";
    setProjectType(type);
    setShowerShape(shape);
  }, []);

  const plumbingSides = [
    {
      id: "right",
      title: "Right",
      description: "Plumbing on the right side",
      image: "/bathtub-right.jpg?w=600&h=400&fit=crop",
    },
    {
      id: "left",
      title: "Left",
      description: "Plumbing on the left side",
      image: "/bathtub-left.jpg?w=600&h=400&fit=crop",
    },
  ];

  const handleSideSelect = (sideId: string) => {
    setSelectedSide(sideId);
    const params = new URLSearchParams({
      type: projectType,
      plumbing: sideId,
    });
    if (showerShape) {
      params.append("shape", showerShape);
    }
    router.push("/DesignBathroom?" + params.toString());
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            How is your plumbing configured?
          </h1>
          <p className="text-lg text-muted-foreground">
            Choose your current plumbing setup to get the best design experience
          </p>
        </motion.div>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {plumbingSides.map((side, index) => (
            <motion.div
              key={side.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card
                onClick={() => handleSideSelect(side.id)}
                className={`cursor-pointer overflow-hidden transition-all border hover:shadow-lg ${
                  selectedSide === side.id ? "ring-2 ring-primary" : ""
                }`}
              >
                {/* Image */}
                <div className="relative aspect-video w-full overflow-hidden">
                  <Image
                    src={side.image}
                    alt={side.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Text */}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{side.title}</CardTitle>
                  <CardDescription>{side.description}</CardDescription>
                </CardHeader>

                <CardFooter className="justify-center pb-6">
                  <Button
                    variant={selectedSide === side.id ? "default" : "outline"}
                    className="group cursor-pointer flex items-center space-x-2"
                  >
                    Select
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
