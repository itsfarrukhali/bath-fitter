"use client";

import { Droplets, FolderOpen, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ProjectType() {
  const router = useRouter();

  const projectTypes = [
    {
      id: "shower",
      title: "Showers",
      description: "Create your ideal shower space",
      icon: Droplets,
      image: "/shower.jpg?raw=true&w=400&h=200&fit=crop",
    },
    {
      id: "existing",
      title: "Load an Existing Project",
      description: "Continue working on a saved design",
      icon: FolderOpen,
      image: "/existing.jpg?raw=true&w=400&h=200&fit=crop",
    },
  ];

  const handleTypeSelect = (typeId: string) => {
    if (typeId === "shower") {
      router.push("/ShowerShape");
    } else if (typeId === "existing") {
      router.push("/LoadProject");
    }
  };

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {projectTypes.map((type, index) => (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card
                onClick={() => handleTypeSelect(type.id)}
                className="cursor-pointer group overflow-hidden border hover:shadow-lg transition-all duration-300"
              >
                <div className="relative aspect-video w-full overflow-hidden">
                  <Image
                    src={type.image}
                    alt={type.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-primary/10 group-hover:bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors duration-300">
                    <type.icon className="w-8 h-8 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                  </div>
                  <CardTitle className="text-2xl group-hover:text-primary transition-colors duration-300">
                    {type.title}
                  </CardTitle>
                  <CardDescription>{type.description}</CardDescription>
                </CardHeader>

                <CardFooter className="justify-center pb-6">
                  <Button
                    variant="link"
                    className="text-primary group-hover:text-primary/80 cursor-pointer"
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
