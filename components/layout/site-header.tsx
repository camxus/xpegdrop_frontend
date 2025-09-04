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
  PlusSquare,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/api/useAuth";
import { useRouter } from "next/navigation";
import { cn, getInitials } from "@/lib/utils";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useProjects } from "@/hooks/api/useProjects";
import DeleteProjectDialogView from "./delete-project-dialog";
import { useDialog } from "@/hooks/use-dialog";
import { useDropbox } from "@/hooks/api/useDropbox";
import { Progress } from "../ui/progress";

interface SiteHeaderProps {
  children: ReactNode;
}

export function SiteHeader({ children }: SiteHeaderProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { show, hide } = useDialog();
  const {
    projects: { data: projects = [] },
    deleteProject: { mutateAsync: deleteProject },
  } = useProjects();
  const {
    stats: { data: stats },
  } = useDropbox();

  const isActive = (path: string) => pathname === path;

  const sidebarItems =
    projects
      .filter((project) => project.status === "created")
      ?.sort((a, b) => {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      })
      .map((project) => ({
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
        animate={{
          opacity: 1,
          width: isSidebarCollapsed ? 64 : 256,
        }}
        className="bg-transparent border-r border-gray-800 flex flex-col overflow-hidden w-full"
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
            {!!sidebarItems.length ? (
              sidebarItems.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
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
                        },
                      }),
                      hidden: {
                        opacity: 0,
                        display: "none",
                        transition: {
                          opacity: { duration: 0.1 },
                        },
                      },
                    }}
                    initial="visible"
                    animate={isSidebarCollapsed ? "hidden" : "visible"}
                    className="whitespace-nowrap overflow-hidden flex-1"
                  >
                    {item.label}
                  </motion.span>

                  {/* X Button (prevents Link navigation) */}
                  <motion.button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteProject(item.id);
                    }}
                    className={cn(
                      "cursor-pointer absolute right-3 opacity-0 group-hover:opacity-100 text-white/60 hover:text-red-500 transition-[opacity,colors] duration-200",
                      isSidebarCollapsed ? "hidden" : "block"
                    )}
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </Link>
              ))
            ) : (
              <motion.span
                variants={{
                  visible: (i: number) => ({
                    opacity: 1,
                    display: "block",
                    transition: {
                      opacity: { duration: 0.1, delay: i * 0.15 },
                    },
                  }),
                  hidden: {
                    opacity: 0,
                    display: "none",
                    transition: {
                      opacity: { duration: 0.1 },
                    },
                  },
                }}
                initial="visible"
                animate={isSidebarCollapsed ? "hidden" : "visible"}
                className="whitespace-nowrap text-center text-muted-foreground"
              >
                No projects added
              </motion.span>
            )}
          </div>
          {/* Avatar at the bottom */}
          <div className="mt-4 pt-4 border-t border-white/10 place-items-start">
            <Link href={"/upload"}>
              <Button className="mb-4 ml-1 w-full">
                <PlusSquare width={24} height={24}/>
                <motion.span
                  variants={{
                    visible: (i: number) => ({
                      opacity: 1,
                      display: "block",
                      transition: {
                        opacity: { duration: 0.1, delay: i * 0.15 },
                      },
                    }),
                    hidden: {
                      opacity: 0,
                      display: "none",
                      transition: {
                        opacity: { duration: 0.1 },
                      },
                    },
                  }}
                  initial="visible"
                  animate={isSidebarCollapsed ? "hidden" : "visible"}
                  className="whitespace-nowrap overflow-hidden flex-1"
                >
                  New Project
                </motion.span>
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="mb-4 flex items-center gap-2 p-2"
                  variant="ghost"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar as string} />
                    <AvatarFallback className="text-sm">
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
      <div className="relative flex-1 flex flex-col overflow-hidden">
        <AnimatePresence>
          {!isSidebarCollapsed && stats?.storage && (
            <motion.div
              className="absolute inset-0 bg-black/50 z-40 flex items-end justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              onClick={() => setIsSidebarCollapsed(true)}
            >
              <motion.div
                className="flex flex-col space-y-2 items-center w-[80%] mb-8 pointer-events-auto"
                initial={{ filter: "blur(20px)", opacity: 0, y: 30 }}
                animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                exit={{ filter: "blur(20px)", opacity: 0, y: 30 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking storage
              >
                <span className="text-xs text-muted-foreground">
                  Storage{" "}
                  {stats.storage.used_percent >= 90
                    ? "Full"
                    : stats.storage.used_percent >= 70
                    ? "Almost Full"
                    : `${stats.storage.used_percent.toFixed(0)}%`}
                </span>

                <Progress
                  value={stats.storage.used_percent}
                  color={
                    stats.storage.used_percent >= 90
                      ? "bg-red-400"
                      : stats.storage.used_percent >= 70
                      ? "bg-amber-400"
                      : "bg-white"
                  }
                  className={cn("w-full h-1 rounded-full")}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
