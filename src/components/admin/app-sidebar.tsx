"use client";
import * as React from "react";
import {
  Folder,
  FolderTree,
  Home,
  LayoutTemplate,
  LogOut,
  Network,
  Package,
  ShowerHead,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "../ui/button";
import Image from "next/image";
import { useTheme } from "next-themes";

// Nav config with lucide icons
const adminNav = [
  { title: "Dashboard", url: "/admin", icon: Home },
  { title: "Project Types", url: "/admin/project-types", icon: Network },
  { title: "Shower Types", url: "/admin/shower-types", icon: ShowerHead },
  { title: "Templates", url: "/admin/templates", icon: LayoutTemplate },
  { title: "Categories", url: "/admin/categories", icon: Folder },
  { title: "Subcategories", url: "/admin/subcategories", icon: FolderTree },
  { title: "Products", url: "/admin/products", icon: Package },
];

export function AdminAppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { theme } = useTheme();

  // Function to check active state
  const isItemActive = (url: string) => {
    if (url === "/") return pathname === "/";
    return pathname?.startsWith(url);
  };

  // Determine logo based on theme
  const logoSrc =
    theme === "dark"
      ? "/home-care-logo-black.jpg"
      : "/home-care-logo-white.jpg";

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={"/"} className="flex items-center">
                <div className="flex items-center space-x-2">
                  <Image
                    src={logoSrc}
                    alt="Home Care"
                    width={100}
                    height={100}
                    className="mr-3"
                  />
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {adminNav.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.title} className="space-x-8 px-3">
                <SidebarMenuButton
                  asChild
                  isActive={isItemActive(item.url)}
                  className="cursor-pointer"
                >
                  <Link href={item.url} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <div className="mt-auto p-4">
        <Button
          onClick={handleLogout}
          className="w-full cursor-pointer"
          variant="destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      <SidebarRail />
    </Sidebar>
  );
}
