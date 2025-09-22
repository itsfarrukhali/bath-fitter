"use client";
import * as React from "react";
import {
  Folder,
  FolderTree,
  LogOut,
  Network,
  Package,
  Palette,
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

// Nav config with lucide icons
const adminNav = [
  { title: "Project Types", url: "/admin/project-types", icon: Network },
  { title: "Shower Types", url: "/admin/shower-types", icon: ShowerHead },
  { title: "Categories", url: "/admin/categories", icon: Folder },
  { title: "Subcategories", url: "/admin/subcategories", icon: FolderTree },
  { title: "Assets", url: "/admin/assets", icon: Package },
  { title: "Color Variants", url: "/admin/color-variants", icon: Palette },
];

export function AdminAppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  // Function to check active state
  const isItemActive = (url: string) => {
    if (url === "/") return pathname === "/";
    return pathname?.startsWith(url);
  };

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
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">BF</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">
                    Bath Fitter
                  </span>
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
