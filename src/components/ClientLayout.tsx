"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();

  // Dashboard area = "/" and any direct children like "/shipment", "/beneficiaries"
  const isDashboard =
    pathname === "/admin" ||
    pathname.startsWith("/admin/categories") ||
    pathname.startsWith("/admin/subcategories") ||
    pathname.startsWith("/admin/products") ||
    pathname.startsWith("/admin/variants") ||
    pathname.startsWith("/admin/shower-types") ||
    pathname.startsWith("/admin/project-types") ||
    pathname.startsWith("/admin/templates");

  const isPrintPage = pathname.startsWith("/design/print");

  if (isDashboard || isPrintPage) {
    return <div className="min-h-screen">{children}</div>;
  }

  // Default layout with Navbar/Footer
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}
