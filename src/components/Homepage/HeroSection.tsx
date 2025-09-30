"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Palette, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function HeroSection() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/project-type");
  };
  return (
    <section className="relative min-h-screen overflow-hidden flex items-center">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-40"
      >
        <source src="/intro.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-white/40 dark:bg-black/40" />

      {/* Hero Content */}
      <div className="relative w-full px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto space-y-8"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
            Design Your
            <span className="text-blue-600 block">Dream Bathroom</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Transform your space with our interactive bathroom configurator.
            Visualize your perfect bath or shower before installation.
          </p>

          <Button
            onClick={handleGetStarted}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md cursor-pointer"
          >
            Get Started
          </Button>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-12">
            <Card className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm border border-white/20 dark:border-white/10">
              <CardContent className="p-6 text-center">
                <Sparkles className="w-8 h-8 text-blue-600 mb-3 mx-auto" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Easy Design
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  No interior design skills required
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm border border-white/20 dark:border-white/10">
              <CardContent className="p-6 text-center">
                <Palette className="w-8 h-8 text-blue-600 mb-3 mx-auto" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Customize Everything
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Choose from hundreds of options
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm border border-white/20 dark:border-white/10">
              <CardContent className="p-6 text-center">
                <Wrench className="w-8 h-8 text-blue-600 mb-3 mx-auto" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Professional Install
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Expert installation included
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
