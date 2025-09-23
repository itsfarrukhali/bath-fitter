"use client";

import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";

// Client wrapper to avoid hydration mismatch and control initial render
export default function ThemeProviderClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hide UI until theme is resolved on the client to prevent flash/mismatch
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="theme"
    >
      {children}
    </ThemeProvider>
  );
}
