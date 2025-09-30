"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => setOpen(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleStartDesign = () => {
    setOpen(false);
    router.push("/project-type");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold">
            Welcome to Bath Fitter&apos;s Design Your Own Bathroom
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Use our interactive tool to design your own bathroom. No interior
            design skills are required. <br /> Follow these quick steps and
            start designing!
          </DialogDescription>
        </DialogHeader>

        <Button
          onClick={handleStartDesign}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center space-x-2 mx-auto cursor-pointer"
        >
          <span>Start Designing</span>
          <ArrowRight className="w-5 h-5" />
        </Button>
      </DialogContent>
    </Dialog>
  );
}
