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

      {/* Print Styles */}
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
            font-size: 13px !important;
            line-height: 1.4 !important;
          }

          body * {
            visibility: visible !important;
          }

          /* Hide non-printable elements */
          .no-print {
            display: none !important;
          }

          /* Print content styling */
          .print-content {
            width: 100% !important;
            max-width: none !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0.3in !important;
            background: white !important;
            color: black !important;
            visibility: visible !important;
          }

          /* Page setup - Single A4 page */
          @page {
            size: A4 portrait;
            margin: 0.3in;
          }

          /* Ensure images are visible and properly sized */
          img {
            max-width: 100% !important;
            height: auto !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            background: transparent !important;
          }

          /* Force black text */
          .print-content h1,
          .print-content h2,
          .print-content h3,
          .print-content p,
          .print-content span,
          .print-content div {
            color: black !important;
          }

          /* Remove all borders */
          .border,
          .border-b,
          .border-t,
          .border-border {
            border: none !important;
          }

          /* Remove card backgrounds and borders */
          .bg-background,
          .bg-muted,
          .bg-card,
          [class*="bg-"] {
            background: white !important;
          }

          /* Color circles - FIXED for print with inline styles */
          .color-circle {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            background-color: inherit !important;
            border: 2px solid #333 !important;
            display: inline-block !important;
            border-radius: 50% !important;
          }

          /* Text sizes for print - LARGER */
          .print-header-title {
            font-size: 28px !important;
            font-weight: bold !important;
            margin-bottom: 12px !important;
          }

          .print-section-title {
            font-size: 20px !important;
            font-weight: 600 !important;
            margin-bottom: 16px !important;
          }

          .print-product-name {
            font-size: 16px !important;
            font-weight: 600 !important;
          }

          .print-product-details {
            font-size: 14px !important;
          }

          .text-xs {
            font-size: 11px !important;
          }
          .text-sm {
            font-size: 13px !important;
          }
          .text-base {
            font-size: 14px !important;
          }

          /* Spacing adjustments */
          .print-spacing-header {
            margin-bottom: 24px !important;
            padding-bottom: 16px !important;
          }

          .print-spacing-section {
            margin-bottom: 24px !important;
          }

          .print-spacing-item {
            margin-bottom: 16px !important;
            padding: 12px !important;
          }

          /* Prevent page breaks */
          .print-content {
            page-break-inside: avoid !important;
          }

          .print-section {
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
          }

          /* Ensure single page */
          body,
          .print-content {
            height: auto !important;
            overflow: visible !important;
          }

          /* Badge styling for print */
          .badge-print {
            background: #e5e7eb !important;
            color: black !important;
            padding: 4px 12px !important;
            border-radius: 4px !important;
            font-size: 12px !important;
          }
        }

        /* Screen styles */
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

// Print Content Component - REDESIGNED
function PrintContentView({
  designData,
  imagesLoaded,
}: {
  designData: ConfiguratorState;
  imagesLoaded: boolean;
}) {
  const productCount = Object.keys(designData.selectedProducts).length;

  return (
    <div className="mx-auto bg-background print:bg-white space-y-6 print-section">
      {/* Header - LARGER */}
      <div className="text-center border-b border-border pb-4 print-spacing-header">
        <h1 className="text-4xl font-bold text-foreground mb-3 print-header-title">
          Shower Design Specification
        </h1>
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <Badge variant="secondary" className="text-sm badge-print px-4 py-1">
            Type: {designData.configuration.showerTypeName}
          </Badge>
          <Badge variant="secondary" className="text-sm badge-print px-4 py-1">
            Plumbing: {designData.configuration.plumbingConfig}
          </Badge>
          <Badge variant="secondary" className="text-sm badge-print px-4 py-1">
            Date: {new Date().toLocaleDateString()}
          </Badge>
        </div>
      </div>

      {/* Design Overview - LARGER IMAGE */}
      <div className="space-y-3 print-spacing-section">
        <h2 className="text-2xl font-semibold text-center text-foreground print-section-title">
          Design Overview
        </h2>
        <div className="flex justify-center">
          <div className="rounded bg-muted/20 p-3">
            <div
              className="relative"
              style={{
                width: "400px",
                height: "400px",
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
                        className="object-contain p-4"
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

      {/* Selected Products - 2 COLUMN LAYOUT */}
      <div className="space-y-3 print-spacing-section">
        <h2 className="text-2xl font-semibold text-center text-foreground print-section-title">
          Selected Products ({productCount})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print-two-columns">
          {Object.entries(designData.selectedProducts).map(
            ([key, selectedProduct], index) => (
              <div
                key={key}
                className="rounded p-4 space-y-3 bg-muted/10 print-spacing-item"
              >
                <div className="flex items-center gap-4">
                  <Badge className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-primary text-primary-foreground">
                    {index + 1}
                  </Badge>
                  <h3 className="font-semibold text-lg text-foreground flex-1 print-product-name">
                    {selectedProduct.product?.name}
                  </h3>
                </div>

                {/* Color Display - ENHANCED with SVG fallback */}
                <div className="flex items-center gap-3">
                  <span className="text-base text-muted-foreground font-medium print-product-details">
                    Color:
                  </span>
                  <div className="flex items-center gap-3">
                    {/* SVG Circle for better print compatibility */}
                    <svg
                      width="24"
                      height="24"
                      style={{ display: "inline-block" }}
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        fill={selectedProduct.variant?.colorCode || "#cccccc"}
                        stroke="#333"
                        strokeWidth="2"
                      />
                    </svg>
                    <span className="text-base text-muted-foreground print-product-details">
                      {selectedProduct.variant?.colorName || "Default"}
                    </span>
                  </div>
                </div>

                {selectedProduct.product?.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed print-product-details">
                    {selectedProduct.product.description}
                  </p>
                )}
              </div>
            )
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-6 text-center">
        <p className="text-base text-muted-foreground font-medium">
          Home Care - We Make Your Dreams Into Reality
        </p>
      </div>
    </div>
  );
}
