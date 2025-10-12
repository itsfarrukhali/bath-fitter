"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import NextImage from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      // Cache busting to ensure fresh load
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
          resolve(true); // Resolve anyway so printing can continue
        }
      };
    });
  });
};

export default function PrintPage() {
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

    // Add base image
    if (data.baseImage) {
      urls.push(data.baseImage);
    }

    // Add product images
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

            // Preload all images with more aggressive approach
            const imageUrls = getAllImageUrls(data);
            console.log("Preloading images:", imageUrls);

            if (imageUrls.length > 0) {
              await preloadImages(imageUrls);
            }

            setImagesLoaded(true);
            console.log("All images preloaded successfully");

            // Clean up this design data after a short delay
            setTimeout(() => {
              storageUtils.removeDesign(designId);
            }, 30000); // 30 seconds for user to print
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
      // Wait a bit more for images
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    setPrintTriggered(true);

    // Small delay to ensure DOM updates and images are rendered
    setTimeout(() => {
      console.log("Triggering print...");
      setHasPrinted(true);

      // Use a longer timeout to ensure everything is ready for print
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
            font-size: 12px !important;
            line-height: 1.3 !important;
          }

          body * {
            visibility: visible !important;
            background: white !important;
            color: black !important;
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
            padding: 0.2in !important;
            background: white !important;
            color: black !important;
            visibility: visible !important;
          }

          /* Page setup - Single A4 page */
          @page {
            size: A4 portrait;
            margin: 0.2in;
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
            background: transparent !important;
          }

          /* Remove backgrounds */
          .bg-background,
          .bg-muted,
          .bg-card {
            background: white !important;
          }

          /* Borders for print */
          .border {
            border-color: #333 !important;
            border-width: 1px !important;
          }

          /* Color circles fix for print */
          .color-circle {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            border: 1px solid #666 !important;
          }

          /* Text sizes for print */
          .text-xs {
            font-size: 10px !important;
          }
          .text-sm {
            font-size: 11px !important;
          }
          .text-base {
            font-size: 12px !important;
          }
          .text-lg {
            font-size: 14px !important;
          }
          .text-xl {
            font-size: 16px !important;
          }
          .text-2xl {
            font-size: 18px !important;
          }
          .text-3xl {
            font-size: 20px !important;
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
        }

        /* Screen styles */
        @media screen {
          .print-content {
            max-width: 210mm; /* A4 width */
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

// Print Content Component
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
      {/* Header */}
      <div className="text-center border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Shower Design Specification
        </h1>
        <div className="flex flex-wrap justify-center gap-3 text-sm">
          <Badge variant="secondary" className="text-xs">
            Type: {designData.configuration.showerTypeName}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Plumbing: {designData.configuration.plumbingConfig}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Date: {new Date().toLocaleDateString()}
          </Badge>
        </div>
      </div>

      {/* Main Content - Single column layout */}
      <div className="space-y-6">
        {/* Design Overview */}
        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-center">
              Design Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex justify-center">
              <div className="border border-border rounded bg-muted/20 p-2">
                <div
                  className="relative"
                  style={{
                    width: "300px",
                    height: "300px",
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
          </CardContent>
        </Card>

        {/* Selected Products */}
        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-center">
              Selected Products ({productCount})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {Object.entries(designData.selectedProducts).map(
                ([key, selectedProduct], index) => (
                  <div
                    key={key}
                    className="border border-border rounded p-3 space-y-2"
                  >
                    <div className="flex items-center gap-3">
                      <Badge className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-primary text-primary-foreground">
                        {index + 1}
                      </Badge>
                      <h3 className="font-semibold text-base text-foreground flex-1">
                        {selectedProduct.product?.name}
                      </h3>
                    </div>

                    {/* Color Display - Fixed for print */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground font-medium">
                        Color:
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className="color-circle inline-block rounded-full border"
                          style={{
                            width: "16px",
                            height: "16px",
                            backgroundColor:
                              selectedProduct.variant?.colorCode || "#cccccc",
                          }}
                        />
                        <span className="text-sm text-muted-foreground">
                          {selectedProduct.variant?.colorName || "Default"}
                        </span>
                      </div>
                    </div>

                    {selectedProduct.product?.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedProduct.product.description}
                      </p>
                    )}
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="border-t border-border pt-4 text-center">
        <p className="text-sm text-muted-foreground">
          Home Care - We Make Your Dreams Into Reality
        </p>
      </div>
    </div>
  );
}
