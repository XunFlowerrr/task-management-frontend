"use client";

import React, { useState, useEffect } from "react"; // Import useState and useEffect
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "./ui/sidebar";
import Image from "next/image";
import { useTheme } from "next-themes";

const LogoSidebar = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false); // Add mounted state

  // Set mounted to true after component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  // Return null or a placeholder until mounted
  if (!mounted) {
    // Option 1: Return null
    // return null;

    // Option 2: Return a placeholder (e.g., the initial 'T' div)
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div className="hover:scale-[103%] hover:cursor-pointer bg-violet-400 text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg font-bold group-data-[state=expanded]:hidden transition-all duration-200 ease-in-out">
              T
            </div>
            {/* Placeholder for the expanded logo area */}
            <div className="w-full flex items-center justify-center p-4 h-[100px]">
              {" "}
              {/* Adjust height as needed */}
              {/* Optionally add a loading spinner or skeleton here */}
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Render the full component once mounted
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="hover:scale-[103%] hover:cursor-pointer bg-violet-400 text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg font-bold group-data-[state=expanded]:hidden transition-all duration-200 ease-in-out">
            T
          </div>
          <div className="w-full flex items-center justify-center p-4">
            <Image
              // Conditionally set the src based on the theme
              src={
                resolvedTheme === "dark" ? "/logo-dark.png" : "/logo-light.png"
              }
              alt="Logo"
              objectFit="cover"
              width="100"
              height="100"
            />
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export default LogoSidebar;
