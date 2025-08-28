"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Calendar,
  Users,
  Heart,
  MessageCircle,
  User,
  Map,
  Plus,
  Bell,
  ChevronLeft,
  ChevronRight,
  NotebookTabs,
  Search,
  Folder,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/api/useAuth";
import { useRouter } from "next/navigation";
import { getInitials } from "@/lib/utils";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useProjects } from "@/hooks/api/useProjects";
import DeleteProjectDialogView from "./delete-project-dialog";
import { useDialog } from "@/hooks/use-dialog";

interface SiteHeaderProps {
  children: ReactNode;
}

export function SiteHeader({ children }: SiteHeaderProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const router = useRouter();

  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { show, hide } = useDialog();
  const {
    projects: { data: projects = [] },
    deleteProject: { mutateAsync: deleteProject },
  } = useProjects();

  const isActive = (path: string) => pathname === path;

  const sidebarItems =
    projects?.map((project) => ({
      id: project.project_id,
      icon: Folder,
      href: project.share_url,
      label: project.name,
    })) || [];

  const handleDeleteProject = (projectId: string) => {
    const project = projects.find(
      (project) => project.project_id === projectId
    );
    if (!project) return;

    show({
      content: () => <DeleteProjectDialogView project={project} />,
      actions: () => (
        <>
          <Button
            onClick={() => {
              // Close the dialog or cancel logic here
              hide(); // assuming you have a hide function
            }}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              // Confirm delete logic here
              deleteProject(project.project_id);
              hide(); // close dialog after delete
            }}
          >
            Delete
          </Button>
        </>
      ),
    });
  };

  if (!user?.user_id) return <>{children}</>;

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ opacity: 1, width: isSidebarCollapsed ? 64 : 256 }}
        className="bg-transparent border-r border-gray-800 flex flex-col overflow-hidden w-[256px]"
      >
        <div className="p-4">
          <div className="flex items-center justify-between gap-2">
            <motion.div
              variants={{
                visible: {
                  opacity: 1,
                  display: "block",
                  transition: { duration: 0.1 },
                },
                hidden: {
                  opacity: 0,
                  display: "none",
                  transition: { duration: 0.1, delay: 0.15 },
                },
              }}
              initial="visible"
              animate={isSidebarCollapsed ? "hidden" : "visible"}
              className="flex items-center gap-2"
            >
              {/* <div className="flex gap-2 items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <span className="font-bold text-lg whitespace-nowrap overflow-hidden">
                  AppName
                </span>
              </div> */}
            </motion.div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <nav className="flex flex-1 flex-col px-2 overflow-hidden">
          {/* Scrollable sidebar items */}
          <div className="flex-1 overflow-y-auto">
            {sidebarItems.map((item, index) => (
              <div
                key={item.href}
                className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                  isActive(item.href)
                    ? "bg-white/5 text-white"
                    : "text-white/80 hover:bg-white/10"
                }`}
              >
                {/* Icon */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <item.icon width={20} height={20} />
                </motion.div>

                {/* Label */}
                <motion.span
                  custom={index}
                  variants={{
                    visible: (i: number) => ({
                      opacity: 1,
                      display: "block",
                      transition: {
                        opacity: { duration: 0.1, delay: i * 0.15 },
                        display: { delay: 0 },
                      },
                    }),
                    hidden: {
                      opacity: 0,
                      display: "none",
                      transition: {
                        opacity: { duration: 0.1 },
                        display: { delay: 0 },
                      },
                    },
                  }}
                  initial="visible"
                  animate={isSidebarCollapsed ? "hidden" : "visible"}
                  className="whitespace-nowrap overflow-hidden flex-1"
                >
                  {item.label}
                </motion.span>

                {/* X Button on Hover */}
                <motion.button
                  onClick={() => handleDeleteProject(item.id)}
                  className="cursor-pointer opacity-0 group-hover:opacity-100 ml-auto text-white/60 hover:text-red-500 transition-[opacity, colors] duration-200"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            ))}
          </div>

          {/* Avatar at the bottom */}
          <div className="mt-4 pt-4 border-t border-white/10 place-items-start">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="mb-4 flex items-center gap-2 p-2"
                  variant="ghost"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar as string} />
                    <AvatarFallback className="text-lg">
                      {getInitials(
                        user?.first_name || "",
                        user?.last_name || ""
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <motion.span
                    className="text-muted-foreground"
                    animate={isSidebarCollapsed ? "hidden" : "visible"}
                    transition={{ duration: 0.1 }}
                    variants={{
                      visible: {
                        opacity: 1,
                        display: "block", // appears immediately
                        transition: {
                          opacity: { duration: 0.1, delay: 0.15 }, // delay only opacity
                          display: { delay: 0.15 }, // no delay
                        },
                      },
                      hidden: {
                        opacity: 0,
                        display: "none",
                        transition: { duration: 0.1, delay: 0.1 },
                      },
                    }}
                  >
                    {user?.username}
                  </motion.span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => logout()}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
