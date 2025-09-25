"use client";

import { Suspense } from "react";
import VariantsPageContent from "@/components/admin/variants/variants-page";
import { Loader2 } from "lucide-react";

export default function VariantsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <VariantsPageContent />
    </Suspense>
  );
}
