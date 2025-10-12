// components/design/print-view.tsx
"use client";

import { ConfiguratorState } from "@/types/design";
import { Button } from "@/components/ui/button";
import { X, Printer } from "lucide-react";
import { useEffect, useState } from "react";

interface PrintViewProps {
  state: ConfiguratorState;
  onClose: () => void;
}

export default function PrintView({ state, onClose }: PrintViewProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePrint = async () => {
    setIsLoading(true);

    // Wait for images to load
    await new Promise((resolve) => setTimeout(resolve, 800));

    window.print();
    setIsLoading(false);
  };

  const handleClose = () => {
    onClose();
  };

  // Prevent body scroll and hide main content when print view is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const mainContent = document.querySelector('main, [role="main"]');

    // Hide main content
    if (mainContent) {
      (mainContent as HTMLElement).style.display = "none";
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
      // Restore main content
      if (mainContent) {
        (mainContent as HTMLElement).style.display = "";
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-white z-[9999] overflow-auto print:static print:inset-auto print:bg-white print:z-auto">
      {/* Print Header - Hidden during print */}
      <div className="no-print flex justify-between items-center p-4 border-b bg-white shadow-sm sticky top-0 z-10">
        <h1 className="text-2xl font-bold">Print Preview</h1>
        <div className="flex gap-2">
          <Button
            onClick={handlePrint}
            disabled={isLoading}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 cursor-pointer flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            {isLoading ? "Preparing..." : "Print Now"}
          </Button>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="border px-4 py-2 rounded-lg hover:bg-gray-100 cursor-pointer flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Close
          </Button>
        </div>
      </div>

      {/* Printable Content */}
      <div className="print-content max-w-3xl mx-auto bg-white p-6">
        {/* Header */}
        <div className="text-center mb-6 pb-4 border-b-2 border-gray-300">
          <h1 className="text-2xl font-bold mb-2">Shower Design</h1>
          <p className="text-md text-gray-800">
            {state.configuration.showerTypeName} •{" "}
            {state.configuration.plumbingConfig} Plumbing
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Generated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Design Overview */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-gray-900">
            Design Overview
          </h2>
          <div
            className="border-2 border-gray-400 rounded-lg p-4 bg-gray-50 mx-auto"
            style={{ maxWidth: "300px", aspectRatio: "1/1" }}
          >
            <div className="relative w-full h-full">
              {/* Base Image */}
              <img
                src={state.baseImage}
                alt="Shower Base"
                className="w-full h-full object-contain"
                style={{ maxWidth: "100%", height: "auto" }}
              />

              {/* Product Overlays */}
              {Object.entries(state.selectedProducts).map(
                ([key, selectedProduct]) => {
                  const imageUrl =
                    selectedProduct.variant?.imageUrl ||
                    selectedProduct.product?.imageUrl;
                  return imageUrl ? (
                    <img
                      key={key}
                      src={imageUrl}
                      alt={selectedProduct.product.name}
                      className="absolute top-0 left-0 w-full h-full object-contain p-4"
                      style={{
                        zIndex: selectedProduct.product?.z_index || 10,
                      }}
                    />
                  ) : null;
                }
              )}
            </div>
          </div>
        </div>

        {/* Selected Products List */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-gray-900">
            Selected Products ({Object.keys(state.selectedProducts).length})
          </h2>
          <div className="space-y-3">
            {Object.entries(state.selectedProducts).map(
              ([key, selectedProduct], index) => (
                <div
                  key={key}
                  className="border border-gray-300 rounded-lg p-3 bg-white"
                  style={{ pageBreakInside: "avoid" }}
                >
                  <div className="flex items-start gap-3">
                    {/* Product Number */}
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>

                    {/* Thumbnail */}
                    {selectedProduct.product?.thumbnailUrl && (
                      <img
                        src={selectedProduct.product.thumbnailUrl}
                        alt={selectedProduct.product.name}
                        className="flex-shrink-0 rounded border border-gray-300"
                        style={{
                          width: "40px",
                          height: "40px",
                          objectFit: "cover",
                        }}
                      />
                    )}

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm mb-1 text-gray-900">
                        {selectedProduct.product?.name}
                      </h3>
                      <p className="text-xs text-gray-700 mb-1">
                        <strong>Color:</strong>{" "}
                        {selectedProduct.variant?.colorName || "Default Color"}
                        {selectedProduct.variant?.colorCode && (
                          <span
                            className="inline-block rounded-full ml-1 border border-gray-400"
                            style={{
                              width: "10px",
                              height: "10px",
                              backgroundColor:
                                selectedProduct.variant.colorCode,
                            }}
                          />
                        )}
                      </p>
                      {selectedProduct.product?.description && (
                        <p className="text-xs text-gray-600 leading-tight">
                          {selectedProduct.product.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-300 pt-3 text-center">
          <p className="text-xs text-gray-600">
            Thank you for using our shower design tool
          </p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          /* Hide everything except the print content */
          body * {
            visibility: hidden;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Show only the print view content */
          .print-content,
          .print-content * {
            visibility: visible !important;
          }

          /* Hide the print view container background and positioning */
          .fixed {
            position: static !important;
            background: white !important;
            overflow: visible !important;
            height: auto !important;
            width: 100% !important;
          }

          /* Hide the print header buttons */
          .no-print {
            display: none !important;
          }

          /* Page Setup */
          @page {
            size: A4;
            margin: 0.5in;
          }

          /* Reset body for print */
          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            font-size: 12px !important;
            line-height: 1.2 !important;
          }

          /* Print content styling */
          .print-content {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
          }

          /* Optimize text sizes for print */
          .print-content h1 {
            font-size: 1.25rem !important;
            margin-bottom: 0.5rem !important;
          }

          .print-content h2 {
            font-size: 1rem !important;
            margin-bottom: 0.5rem !important;
          }

          .print-content h3 {
            font-size: 0.875rem !important;
          }

          .print-content p {
            font-size: 0.75rem !important;
          }

          /* Reduce spacing */
          .print-content .mb-6 {
            margin-bottom: 1rem !important;
          }

          .print-content .mb-3 {
            margin-bottom: 0.5rem !important;
          }

          .print-content .p-6 {
            padding: 1rem !important;
          }

          .print-content .p-4 {
            padding: 0.5rem !important;
          }

          .print-content .p-3 {
            padding: 0.5rem !important;
          }

          .print-content .pb-4 {
            padding-bottom: 0.5rem !important;
          }

          .print-content .pt-3 {
            padding-top: 0.5rem !important;
          }

          /* Smaller design overview */
          .print-content > div:nth-child(2) > div {
            max-width: 250px !important;
            margin: 0 auto !important;
          }

          /* Optimize images */
          .print-content img {
            max-width: 100% !important;
            height: auto !important;
          }

          /* Product cards */
          .print-content .space-y-3 > * {
            margin-bottom: 0.5rem !important;
          }

          /* Ensure borders are visible but subtle */
          .print-content .border,
          .print-content .border-2,
          .print-content .border-b-2 {
            border-color: #666 !important;
            border-width: 1px !important;
          }

          /* Remove rounded corners for print efficiency */
          .print-content .rounded-lg,
          .print-content .rounded {
            border-radius: 2px !important;
          }

          .print-content .rounded-full {
            border-radius: 50% !important;
          }

          /* Ensure backgrounds are visible */
          .print-content .bg-gray-50 {
            background-color: #f9fafb !important;
          }

          .print-content .bg-gray-200 {
            background-color: #e5e7eb !important;
          }

          .print-content .bg-white {
            background-color: #ffffff !important;
          }
        }

        /* Screen preview styles */
        @media screen {
          .print-content {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
          }
        }
      `}</style>
    </div>
  );
}
