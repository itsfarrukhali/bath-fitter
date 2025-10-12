"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
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
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <p className="text-red-600 text-lg mb-4">
            {error || "No design data found"}
          </p>
          <p className="text-gray-600 mb-6">
            Please go back to the design page and try printing again.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.close()}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleRetry}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoading && designData) {
    return (
      <div className="min-h-screen bg-white print:bg-white">
        {/* Print Now Button - Only visible on screen */}
        {!hasPrinted && (
          <div className="no-print fixed top-4 right-4 z-50">
            <button
              onClick={handlePrint}
              disabled={!imagesLoaded || printTriggered}
              className={`px-6 py-3 rounded-lg shadow-lg transition-colors cursor-pointer font-semibold flex items-center gap-2 ${
                imagesLoaded && !printTriggered
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-400 text-gray-200 cursor-not-allowed"
              }`}
            >
              <span>🖨️</span>
              <span>
                {printTriggered
                  ? "Preparing Print..."
                  : imagesLoaded
                  ? "Print Now"
                  : "Loading Images..."}
              </span>
            </button>
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
              font-size: 14px !important; /* Increased from 12px */
              line-height: 1.4 !important; /* Increased from 1.2 */
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
              padding: 0.3in !important; /* Increased from 0.2in */
              background: white !important;
              color: black !important;
              visibility: visible !important;
            }

            /* Page setup */
            @page {
              size: A4 portrait;
              margin: 0.3in; /* Increased from 0.2in */
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
              font-size: 11px !important; /* Increased from 9px */
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
              max-width: 6xl; /* Increased from 4xl */
              margin: 0 auto;
              padding: 2rem; /* Increased from 1.5rem */
              background: white;
              color: black;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              border-radius: 4px;
            }

            .text-2xs {
              font-size: 0.75rem; /* Increased from 0.65rem */
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
        hasManyProducts ? "max-w-7xl" : "max-w-6xl" // Increased max width
      }`}
    >
      {/* Header - Larger font sizes */}
      <div className="text-center mb-8 border-b border-gray-300 pb-6 print-section">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">
          {" "}
          {/* Increased from text-2xl */}
          Shower Design Specification
        </h1>
        <div className="flex flex-wrap justify-center gap-6 text-base text-gray-700">
          {" "}
          {/* Increased from text-sm */}
          <span className="text-lg">
            {" "}
            {/* Added larger text */}
            <strong>Type:</strong> {designData.configuration.showerTypeName}
          </span>
          <span className="text-lg">
            <strong>Plumbing:</strong> {designData.configuration.plumbingConfig}
          </span>
          <span className="text-lg">
            <strong>Date:</strong> {new Date().toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`grid gap-8 mb-8 ${
          hasManyProducts ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
        }`}
      >
        {/* Design Overview - Larger container */}
        <div
          className={`print-section ${hasManyProducts ? "" : "lg:col-span-2"}`}
        >
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 text-center">
            {" "}
            {/* Increased from text-lg */}
            Design Overview
          </h2>
          <div className="flex justify-center">
            <div
              className="border-2 border-gray-400 rounded-lg bg-gray-50" // Added border-2
              style={{
                width: hasManyProducts ? "450px" : "500px", // Increased from 300px/350px
                height: hasManyProducts ? "450px" : "500px", // Increased from 300px/350px
                maxWidth: "100%",
              }}
            >
              <div className="relative w-full h-full p-6">
                {" "}
                {/* Increased padding */}
                {/* Base Image */}
                {imagesLoaded && (
                  <>
                    <img
                      src={designData.baseImage}
                      alt="Shower Base"
                      className="w-full h-full object-contain"
                      onLoad={(e) => {
                        console.log("Base image rendered in DOM");
                        // Force reflow to ensure image is visible
                        (e.target as HTMLImageElement).style.display = "block";
                      }}
                      onError={(e) => {
                        console.error(
                          "Failed to render base image:",
                          designData.baseImage
                        );
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />

                    {/* Product Overlays */}
                    {Object.entries(designData.selectedProducts).map(
                      ([key, selectedProduct]) => {
                        const imageUrl =
                          selectedProduct.variant?.imageUrl ||
                          selectedProduct.product?.imageUrl;
                        return imageUrl ? (
                          <img
                            key={key}
                            src={imageUrl}
                            alt={selectedProduct.product.name}
                            className="absolute top-0 left-0 w-full h-full object-contain p-6" // Increased padding
                            style={{
                              zIndex: selectedProduct.product?.z_index || 10,
                            }}
                            onLoad={(e) => {
                              console.log(
                                `Product image rendered: ${selectedProduct.product.name}`
                              );
                              (e.target as HTMLImageElement).style.display =
                                "block";
                            }}
                            onError={(e) => {
                              console.error(
                                "Failed to render product image:",
                                imageUrl
                              );
                              (e.target as HTMLImageElement).style.display =
                                "none";
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
        </div>

        {/* Selected Products - Larger text and spacing */}
        <div
          className={`print-section ${hasManyProducts ? "" : "lg:col-span-2"}`}
        >
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 text-center">
            {" "}
            {/* Increased from text-lg */}
            Selected Products ({Object.keys(designData.selectedProducts).length}
            )
          </h2>

          <div
            className={`grid gap-4 ${
              hasManyProducts ? "grid-cols-2" : "grid-cols-1"
            }`}
          >
            {Object.entries(designData.selectedProducts).map(
              ([key, selectedProduct], index) => (
                <div
                  key={key}
                  className="border-2 border-gray-300 rounded-lg p-4 bg-white text-sm" // Increased border and padding
                >
                  <div className="flex items-start gap-3">
                    {" "}
                    {/* Increased gap */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold">
                      {" "}
                      {/* Increased size */}
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-2 text-gray-900 leading-tight">
                        {" "}
                        {/* Increased from text-sm */}
                        {selectedProduct.product?.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        {" "}
                        {/* Increased gap */}
                        <span className="text-base text-gray-700">
                          {" "}
                          {/* Increased from text-xs */}
                          <strong>Color:</strong>{" "}
                          {selectedProduct.variant?.colorName || "Default"}
                        </span>
                        {selectedProduct.variant?.colorCode && (
                          <span
                            className="inline-block rounded-full border border-gray-400"
                            style={{
                              width: "16px", // Increased from 10px
                              height: "16px", // Increased from 10px
                              backgroundColor:
                                selectedProduct.variant.colorCode,
                            }}
                          />
                        )}
                      </div>
                      {selectedProduct.product?.description && (
                        <p className="text-sm text-gray-600 leading-tight">
                          {" "}
                          {/* Increased from text-2xs */}
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
                        <img
                          src={selectedProduct.product.thumbnailUrl}
                          alt={selectedProduct.product.name}
                          className="flex-shrink-0 rounded-lg border-2 border-gray-300" // Increased border
                          style={{
                            width: "60px", // Increased from 40px
                            height: "60px", // Increased from 40px
                            objectFit: "cover",
                          }}
                        />
                      )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Footer - Larger text */}
      <div className="border-t-2 border-gray-300 pt-4 text-center print-section">
        {" "}
        {/* Increased border */}
        <p className="text-sm text-gray-600">
          {" "}
          {/* Increased from text-xs */}
          Home Care - We Make Your Dreams Into Reality
        </p>
      </div>
    </div>
  );
}
