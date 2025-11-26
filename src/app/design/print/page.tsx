"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import NextImage from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfiguratorState } from "@/types/design";

// Utility functions matching design page
const storageUtils = {
  getCurrentDesigns: (): string[] => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("currentDesigns") || "[]");
    } catch {
      return [];
    }
  },

  removeDesign: (designId: string) => {
    try {
      localStorage.removeItem(designId);
      const currentDesigns = storageUtils.getCurrentDesigns();
      const updatedDesigns = currentDesigns.filter(
        (id: string) => id !== designId
      );
      localStorage.setItem("currentDesigns", JSON.stringify(updatedDesigns));
    } catch (error) {
      console.error("Error removing design:", error);
    }
  },
};

// Image preloading with cache busting
const preloadImages = (imageUrls: string[]): Promise<boolean> => {
  return new Promise((resolve) => {
    let loadedCount = 0;
    const totalImages = imageUrls.length;

    if (totalImages === 0) {
      resolve(true);
      return;
    }

    imageUrls.forEach((url) => {
      const img = new Image();
      const cacheBustedUrl =
        url + (url.includes("?") ? "&" : "?") + "t=" + Date.now();

      img.src = cacheBustedUrl;
      img.onload = () => {
        loadedCount++;
        console.log(`Image loaded: ${url} (${loadedCount}/${totalImages})`);
        if (loadedCount === totalImages) {
          resolve(true);
        }
      };
      img.onerror = () => {
        loadedCount++;
        console.warn(`Failed to load image: ${url}`);
        if (loadedCount === totalImages) {
          resolve(true);
        }
      };
    });
  });
};

// Separate component that uses useSearchParams
function PrintPageContent() {
  const searchParams = useSearchParams();
  const [designData, setDesignData] = useState<ConfiguratorState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPrinted, setHasPrinted] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [printTriggered, setPrintTriggered] = useState(false);
  const printContentRef = useRef<HTMLDivElement>(null);

  // Get all image URLs from design data
  const getAllImageUrls = (data: ConfiguratorState): string[] => {
    const urls: string[] = [];

    if (data.baseImage) {
      urls.push(data.baseImage);
    }

    Object.values(data.selectedProducts).forEach((selectedProduct) => {
      const imageUrl =
        selectedProduct.variant?.imageUrl || selectedProduct.product?.imageUrl;
      if (imageUrl) {
        urls.push(imageUrl);
      }
    });

    return urls.filter((url) => url && url.trim() !== "");
  };

  useEffect(() => {
    const loadDesignData = async () => {
      try {
        const designId = searchParams.get("designId");

        if (!designId) {
          setError("No design ID provided");
          setIsLoading(false);
          return;
        }

        const savedDesign = localStorage.getItem(designId);

        if (savedDesign) {
          try {
            const data = JSON.parse(savedDesign);
            setDesignData(data);
            setError(null);

            const imageUrls = getAllImageUrls(data);
            console.log("Preloading images:", imageUrls);

            if (imageUrls.length > 0) {
              await preloadImages(imageUrls);
            }

            setImagesLoaded(true);
            console.log("All images preloaded successfully");

            setTimeout(() => {
              storageUtils.removeDesign(designId);
            }, 30000);
          } catch (parseError) {
            console.error("Error parsing design data:", parseError);
            setError("Invalid design data format");
          }
        } else {
          setError("Design data not found. It may have expired.");
        }
      } catch (error) {
        console.error("Error loading design data:", error);
        setError("Failed to load design data");
      } finally {
        setIsLoading(false);
      }
    };

    loadDesignData();
  }, [searchParams]);

  const handlePrint = async () => {
    if (!imagesLoaded) {
      console.log("Images not loaded yet, waiting...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    setPrintTriggered(true);

    setTimeout(() => {
      console.log("Triggering print...");
      setHasPrinted(true);

      setTimeout(() => {
        window.print();
      }, 500);
    }, 100);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setImagesLoaded(false);
    setPrintTriggered(false);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading print preview...</p>
          {!imagesLoaded && (
            <p className="text-sm text-muted-foreground mt-2">
              Loading images...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error || !designData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="text-center max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-destructive text-6xl mb-4">⚠️</div>
            <CardTitle className="text-destructive text-lg mb-4">
              {error || "No design data found"}
            </CardTitle>
            <p className="text-muted-foreground mb-6">
              Please go back to the design page and try printing again.
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => window.close()}>
                Close
              </Button>
              <Button onClick={handleRetry}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background print:bg-white">
      {/* Print Now Button - Only visible on screen */}
      {!hasPrinted && (
        <div className="no-print fixed top-4 right-4 z-50">
          <Button
            onClick={handlePrint}
            disabled={!imagesLoaded || printTriggered}
            className="flex items-center gap-2"
            size="lg"
          >
            <span>🖨️</span>
            <span>
              {printTriggered
                ? "Preparing Print..."
                : imagesLoaded
                ? "Print Now"
                : "Loading Images..."}
            </span>
          </Button>
        </div>
      )}

      {/* Printable Content */}
      <div ref={printContentRef} className="print-content">
        <PrintContentView designData={designData} imagesLoaded={imagesLoaded} />
      </div>

      {/* Print Styles - OPTIMIZED FOR SINGLE A4 PAGE */}
      <style jsx global>{`
        @media print {
          /* Reset everything for print */
          * {
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          html,
          body {
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
            font-family: Arial, Helvetica, sans-serif !important;
            font-size: 11px !important;
            line-height: 1.3 !important;
          }

          body * {
            visibility: visible !important;
          }

          /* Hide non-printable elements */}
          .no-print {
            display: none !important;
          }

          /* Print content styling - COMPACT */}
          .print-content {
            width: 100% !important;
            max-width: none !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0.25in !important;
            background: white !important;
            color: black !important;
            visibility: visible !important;
          }

          /* Page setup - Single A4 page with minimal margins */}
          @page {
            size: A4 portrait;
            margin: 0.25in;
          }

          /* Ensure images are visible and properly sized */}
          img {
            max-width: 100% !important;
            height: auto !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            background: transparent !important;
          }

          /* Force black text */}
          .print-content h1,
          .print-content h2,
          .print-content h3,
          .print-content p,
          .print-content span,
          .print-content div {
            color: black !important;
          }

          /* Remove all borders except intentional ones */}
          .border,
          .border-b:not(.print-spacing-header):not(.border-t) {
            border: none !important;
          }

          /* Keep header and footer borders */}
          .print-spacing-header {
            border-bottom: 1px solid #ddd !important;
            padding-bottom: 6px !important;
            margin-bottom: 8px !important;
          }

          .border-t.border-border {
            border-top: 1px solid #ddd !important;
            padding-top: 6px !important;
          }

          /* Remove card backgrounds */}
          .bg-background,
          .bg-muted,
          .bg-card,
          [class*="bg-"]:not(.bg-primary):not(.bg-muted\/10) {
            background: white !important;
          }

          .bg-muted\/10,
          .bg-muted\/20 {
            background: #f5f5f5 !important;
          }

          /* Color circles - FIXED for print */}
          .color-circle {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            background-color: inherit !important;
            border: 1.5px solid #333 !important;
            display: inline-block !important;
            border-radius: 50% !important;
          }

          /* Text sizes for print - COMPACT */}
          .print-header-title {
            font-size: 22px !important;
            font-weight: bold !important;
            margin-bottom: 6px !important;
          }

          .print-section-title {
            font-size: 16px !important;
            font-weight: 600 !important;
            margin-bottom: 6px !important;
          }

          .print-product-name {
            font-size: 12px !important;
            font-weight: 600 !important;
            line-height: 1.2 !important;
          }

          .print-product-details {
            font-size: 10px !important;
          }

          .text-xs {
            font-size: 9px !important;
          }
          .text-sm {
            font-size: 10px !important;
          }
          .text-base {
            font-size: 11px !important;
          }
          .text-lg {
            font-size: 14px !important;
          }
          .text-3xl {
            font-size: 22px !important;
          }

          /* Spacing adjustments - COMPACT */}
          .print-spacing-header {
            margin-bottom: 8px !important;
          }

          .print-spacing-section {
            margin-bottom: 8px !important;
          }

          .print-spacing-item {
            margin-bottom: 4px !important;
            padding: 6px !important;
          }

          .space-y-4 > * + * {
            margin-top: 8px !important;
          }

          .space-y-2 > * + * {
            margin-top: 4px !important;
          }

          .space-y-1 > * + * {
            margin-top: 2px !important;
          }

          .gap-2 {
            gap: 4px !important;
          }

          .gap-4 {
            gap: 6px !important;
          }

          /* Prevent page breaks */}
          .print-content {
            page-break-inside: avoid !important;
          }

          .print-section {
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
          }

          /* Ensure single page */}
          body,
          .print-content {
            height: auto !important;
            overflow: visible !important;
          }

          /* Badge styling for print - COMPACT */}
          .badge-print {
            background: #e5e7eb !important;
            color: black !important;
            padding: 2px 8px !important;
            border-radius: 3px !important;
            font-size: 9px !important;
            display: inline-block !important;
          }

          /* Grid layout for products */}
          .print-two-columns {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 4px !important;
          }

          /* Line clamp */}
          .line-clamp-1 {
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
          }

          /* Compact padding */}
          .p-2 {
            padding: 4px !important;
          }

          .pb-2 {
            padding-bottom: 4px !important;
          }

          .pt-2 {
            padding-top: 4px !important;
          }

          .mb-2 {
            margin-bottom: 4px !important;
          }

          .ml-8 {
            margin-left: 16px !important;
          }
        }

        /* Screen styles */}
        @media screen {
          .print-content {
            max-width: 210mm;
            margin: 0 auto;
            padding: 2rem;
            background: hsl(var(--background));
            color: hsl(var(--foreground));
            min-height: 100vh;
          }
        }
      `}</style>
    </div>
  );
}

// Main export with Suspense boundary
export default function PrintPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading print preview...</p>
          </div>
        </div>
      }
    >
      <PrintPageContent />
    </Suspense>
  );
}

// Print Content Component - OPTIMIZED FOR SINGLE A4 PAGE
function PrintContentView({
  designData,
  imagesLoaded,
}: {
  designData: ConfiguratorState;
  imagesLoaded: boolean;
}) {
  const productCount = Object.keys(designData.selectedProducts).length;

  return (
    <div className="mx-auto bg-background print:bg-white space-y-4 print-section">
      {/* Header - COMPACT */}
      <div className="text-center border-b border-border pb-2 print-spacing-header">
        <h1 className="text-3xl font-bold text-foreground mb-2 print-header-title">
          Shower Design Specification
        </h1>
        <div className="flex flex-wrap justify-center gap-2 text-xs">
          <Badge variant="secondary" className="text-xs badge-print px-3 py-0.5">
            {designData.configuration.showerTypeName}
          </Badge>
          <Badge variant="secondary" className="text-xs badge-print px-3 py-0.5">
            {designData.configuration.plumbingConfig} Plumbing
          </Badge>
          <Badge variant="secondary" className="text-xs badge-print px-3 py-0.5">
            {new Date().toLocaleDateString()}
          </Badge>
        </div>
      </div>

      {/* Design Overview - SMALLER IMAGE */}
      <div className="space-y-2 print-spacing-section">
        <h2 className="text-lg font-semibold text-center text-foreground print-section-title">
          Design Preview
        </h2>
        <div className="flex justify-center">
          <div className="rounded bg-muted/20 p-2">
            <div
              className="relative"
              style={{
                width: "280px",
                height: "280px",
                maxWidth: "100%",
              }}
            >
              {/* Base Image */}
              {imagesLoaded && designData.baseImage && (
                <NextImage
                  src={designData.baseImage}
                  alt="Shower Base"
                  fill
                  className="object-contain"
                />
              )}

              {/* Product Overlays */}
              {imagesLoaded &&
                Object.entries(designData.selectedProducts).map(
                  ([key, selectedProduct]) => {
                    const imageUrl =
                      selectedProduct.variant?.imageUrl ||
                      selectedProduct.product?.imageUrl;
                    return imageUrl ? (
                      <NextImage
                        key={key}
                        src={imageUrl}
                        alt={selectedProduct.product.name}
                        fill
                        className="object-contain p-3"
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
      </div>

      {/* Selected Products - COMPACT 2 COLUMN LAYOUT */}
      <div className="space-y-2 print-spacing-section">
        <h2 className="text-lg font-semibold text-center text-foreground print-section-title">
          Selected Products ({productCount})
        </h2>
        <div className="grid grid-cols-2 gap-2 print-two-columns">
          {Object.entries(designData.selectedProducts).map(
            ([key, selectedProduct], index) => (
              <div
                key={key}
                className="rounded p-2 space-y-1 bg-muted/10 print-spacing-item"
              >
                <div className="flex items-center gap-2">
                  <Badge className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-primary text-primary-foreground shrink-0">
                    {index + 1}
                  </Badge>
                  <h3 className="font-semibold text-sm text-foreground flex-1 print-product-name line-clamp-1">
                    {selectedProduct.product?.name}
                  </h3>
                </div>

                {/* Color Display - COMPACT */}
                <div className="flex items-center gap-2 ml-8">
                  <svg
                    width="16"
                    height="16"
                    style={{ display: "inline-block", flexShrink: 0 }}
                  >
                    <circle
                      cx="8"
                      cy="8"
                      r="6"
                      fill={selectedProduct.variant?.colorCode || "#cccccc"}
                      stroke="#333"
                      strokeWidth="1.5"
                    />
                  </svg>
                  <span className="text-xs text-muted-foreground print-product-details truncate">
                    {selectedProduct.variant?.colorName || "Default"}
                  </span>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Footer - COMPACT */}
      <div className="pt-2 text-center border-t border-border">
        <p className="text-xs text-muted-foreground font-medium">
          Home Care - We Make Your Dreams Into Reality
        </p>
      </div>
    </div>
  );
}
