"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { LayoutList } from "lucide-react";
import { UsersRound } from "lucide-react";
import { Settings } from "lucide-react";
import { House } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar, // Import useSidebar
} from "@/components/ui/sidebar";
import { Project } from "@/lib/api/projects";
import { Avatar, AvatarFallback } from "@/components/ui/avatar"; // Import Avatar components
import { getInitials, generateGradientBackground } from "@/lib/utils"; // Import utils

const subMenuItems = [
  {
    title: "Project Dashboard",
    icons: <House className="h-3.5 w-3.5" />,
    href: "", // Base path will be appended with project ID
  },
  {
    title: "Tasks",
    icons: <LayoutList className="h-3.5 w-3.5" />,
    href: "/tasks",
  },
  {
    title: "Members",
    icons: <UsersRound className="h-3.5 w-3.5" />,
    href: "/team",
  },
  {
    title: "Settings",
    icons: <Settings className="h-3.5 w-3.5" />,
    href: "/settings",
  },
];

export function ProjectNav({ items }: { items: Project[] | undefined }) {
  const { state } = useSidebar(); // Get sidebar state

  if (!items || items.length === 0) {
    return null;
  }

  // Filter out duplicate projects based on project_id before mapping
  const uniqueItems = items.filter(
    (item, index, self) =>
      index === self.findIndex((t) => t.project_id === item.project_id)
  );

  return (
    <SidebarGroup className="overflow-x-hidden">
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarMenu>
        {/* Map over the uniqueItems array instead of items */}
        {uniqueItems.map((item) => (
          <Collapsible
            key={item.project_id}
            asChild
            defaultOpen={false}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={item.project_name}>
                  {/* Using category as an optional filter for showing an icon */}
                  {state === "collapsed" ? ( // Check if collapsed
                    <Avatar className="h-6 w-6 rounded-">
                      <AvatarFallback
                        style={{
                          background: generateGradientBackground(
                            item.project_name || item.project_id
                          ),
                          color: "white",
                          fontSize: "0.7rem",
                        }}
                      >
                        {getInitials(item.project_name)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <span>{item.project_name}</span> // Show full name if expanded
                  )}
                  <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {subMenuItems?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton asChild>
                        <Link
                          href={`/dashboard/projects/${item.project_id}${subItem.href}`}
                        >
                          <div className="flex items-center gap-2">
                            {subItem.icons}
                            <span className="text-xs">{subItem.title}</span>
                          </div>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
