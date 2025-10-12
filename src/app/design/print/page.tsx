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

  // Calculate if we have too many products for single page
  const hasManyProducts = Boolean(
    designData && Object.keys(designData.selectedProducts).length > 4
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading print preview...</p>
          {!imagesLoaded && (
            <p className="text-sm text-gray-500 mt-2">Loading images...</p>
          )}
        </div>
      </div>
    );
  }

  if (error || !designData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Card className="text-center max-w-md mx-auto p-6">
          <CardContent>
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <CardTitle className="text-red-600 text-lg mb-4">
              {error || "No design data found"}
            </CardTitle>
            <p className="text-gray-600 mb-6">
              Please go back to the design page and try printing again.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => window.close()}
                className="bg-gray-500 text-white hover:bg-gray-600"
              >
                Close
              </Button>
              <Button onClick={handleRetry}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isLoading && designData) {
    return (
      <div className="min-h-screen bg-white print:bg-white">
        {/* Print Now Button - Only visible on screen */}
        {!hasPrinted && (
          <div className="no-print fixed top-4 right-4 z-50">
            <Button
              onClick={handlePrint}
              disabled={!imagesLoaded || printTriggered}
              className={`flex items-center gap-2 ${
                imagesLoaded && !printTriggered ? "" : "cursor-not-allowed"
              }`}
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
            {!imagesLoaded && (
              <p className="text-xs text-gray-600 mt-2 text-center">
                Please wait while images load...
              </p>
            )}
          </div>
        )}

        {/* Printable Content - Using a more reliable approach */}
        <div ref={printContentRef} className="print-content">
          <PrintContentView
            designData={designData}
            hasManyProducts={hasManyProducts}
            imagesLoaded={imagesLoaded}
          />
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
              font-size: 14px !important;
              line-height: 1.4 !important;
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
              padding: 0.3in !important;
              background: white !important;
              color: black !important;
              visibility: visible !important;
            }

            /* Page setup */
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
              background: transparent !important;
            }

            /* Remove backgrounds */
            .bg-white,
            .bg-gray-50,
            .bg-gray-200 {
              background: white !important;
            }

            /* Borders for print */
            .border {
              border-color: #666 !important;
              border-width: 1px !important;
            }

            /* Increased text sizes for print */
            .text-2xs {
              font-size: 11px !important;
              line-height: 1.3 !important;
            }

            .text-xs {
              font-size: 12px !important;
              line-height: 1.3 !important;
            }

            .text-sm {
              font-size: 14px !important;
              line-height: 1.4 !important;
            }

            .text-lg {
              font-size: 18px !important;
              line-height: 1.4 !important;
            }

            .text-xl {
              font-size: 20px !important;
              line-height: 1.4 !important;
            }

            .text-2xl {
              font-size: 24px !important;
              line-height: 1.3 !important;
            }

            .text-3xl {
              font-size: 28px !important;
              line-height: 1.3 !important;
            }

            /* Prevent page breaks */
            .print-content {
              page-break-inside: avoid !important;
            }

            .print-section {
              page-break-inside: avoid !important;
            }
          }

          /* Screen styles */
          @media screen {
            .print-content {
              max-width: 6xl;
              margin: 0 auto;
              padding: 2rem;
              background: white;
              color: black;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              border-radius: 4px;
            }

            .text-2xs {
              font-size: 0.75rem;
              line-height: 1.2;
            }
          }
        `}</style>
      </div>
    );
  }
}

// Separate component for print content to ensure proper rendering
function PrintContentView({
  designData,
  hasManyProducts,
  imagesLoaded,
}: {
  designData: ConfiguratorState;
  hasManyProducts: boolean;
  imagesLoaded: boolean;
}) {
  return (
    <div
      className={`mx-auto bg-white ${
        hasManyProducts ? "max-w-7xl" : "max-w-6xl"
      }`}
    >
      {/* Header - Larger font sizes */}
      <Card className="text-center mb-8 border-b border-gray-300 pb-6 print-section">
        <CardHeader>
          <CardTitle className="text-3xl font-bold mb-4 text-gray-900">
            Shower Design Specification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap justify-center gap-6 text-base text-gray-700">
            <Badge variant="secondary" className="text-lg">
              <strong>Type:</strong> {designData.configuration.showerTypeName}
            </Badge>
            <Badge variant="secondary" className="text-lg">
              <strong>Plumbing:</strong>{" "}
              {designData.configuration.plumbingConfig}
            </Badge>
            <Badge variant="secondary" className="text-lg">
              <strong>Date:</strong> {new Date().toLocaleDateString()}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div
        className={`grid gap-8 mb-8 ${
          hasManyProducts ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
        }`}
      >
        {/* Design Overview - Larger container */}
        <Card
          className={`print-section ${hasManyProducts ? "" : "lg:col-span-2"}`}
        >
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-gray-900 text-center">
              Design Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div
                className="border-2 border-gray-400 rounded-lg bg-gray-50"
                style={{
                  width: hasManyProducts ? "450px" : "500px",
                  height: hasManyProducts ? "450px" : "500px",
                  maxWidth: "100%",
                }}
              >
                <div className="relative w-full h-full p-6">
                  {/* Base Image */}
                  {imagesLoaded && (
                    <>
                      <NextImage
                        src={designData.baseImage}
                        alt="Shower Base"
                        fill
                        className="object-contain"
                        onLoad={() => console.log("Base image rendered in DOM")}
                        onError={() => {
                          console.error(
                            "Failed to render base image:",
                            designData.baseImage
                          );
                        }}
                      />

                      {/* Product Overlays */}
                      {Object.entries(designData.selectedProducts).map(
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
                              className="object-contain p-6"
                              style={{
                                zIndex: selectedProduct.product?.z_index || 10,
                              }}
                              onLoad={() =>
                                console.log(
                                  `Product image rendered: ${selectedProduct.product.name}`
                                )
                              }
                              onError={() => {
                                console.error(
                                  "Failed to render product image:",
                                  imageUrl
                                );
                              }}
                            />
                          ) : null;
                        }
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Products - Larger text and spacing */}
        <Card
          className={`print-section ${hasManyProducts ? "" : "lg:col-span-2"}`}
        >
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-gray-900 text-center">
              Selected Products (
              {Object.keys(designData.selectedProducts).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`grid gap-4 ${
                hasManyProducts ? "grid-cols-2" : "grid-cols-1"
              }`}
            >
              {Object.entries(designData.selectedProducts).map(
                ([key, selectedProduct], index) => (
                  <Card key={key} className="border-2 border-gray-300 p-4">
                    <CardContent className="p-0">
                      <div className="flex items-start gap-3">
                        <Badge className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </Badge>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-2 text-gray-900 leading-tight">
                            {selectedProduct.product?.name}
                          </h3>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-base text-gray-700">
                              <strong>Color:</strong>{" "}
                              {selectedProduct.variant?.colorName || "Default"}
                            </span>
                            {selectedProduct.variant?.colorCode && (
                              <span
                                className="inline-block rounded-full border border-gray-400"
                                style={{
                                  width: "16px",
                                  height: "16px",
                                  backgroundColor:
                                    selectedProduct.variant.colorCode,
                                }}
                              />
                            )}
                          </div>
                          {selectedProduct.product?.description && (
                            <p className="text-sm text-gray-600 leading-tight">
                              {selectedProduct.product.description.length > 80
                                ? `${selectedProduct.product.description.substring(
                                    0,
                                    80
                                  )}...`
                                : selectedProduct.product.description}
                            </p>
                          )}
                        </div>

                        {!hasManyProducts &&
                          selectedProduct.product?.thumbnailUrl && (
                            <div className="flex-shrink-0">
                              <NextImage
                                src={selectedProduct.product.thumbnailUrl}
                                alt={selectedProduct.product.name}
                                width={60}
                                height={60}
                                className="rounded-lg border-2 border-gray-300 object-cover"
                              />
                            </div>
                          )}
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer - Larger text */}
      <Card className="border-t-2 border-gray-300 print-section">
        <CardContent className="pt-4 text-center">
          <p className="text-sm text-gray-600">
            Home Care - We Make Your Dreams Into Reality
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
