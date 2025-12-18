"use client";

import { ReactNode, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Folder,
  X,
  PlusSquare,
  Mails,
  ChevronsUpDown,
  CircleFadingArrowUp,
  Search,
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
import { cn, getInitials } from "@/lib/utils";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useProjects } from "@/hooks/api/useProjects";
import DeleteProjectDialogView from "./delete-project-dialog";
import { useDialog } from "@/hooks/use-dialog";
import { useDropbox } from "@/hooks/api/useDropbox";
import { useReferrals } from "@/hooks/api/useReferrals";
import { MakeReferralComponent } from "../make-referral-dialog";
import { MAX_REFERRALS_AMOUNT } from "@/lib/api/referralsApi";
import { useTenants } from "../tenants-provider";
import UpgradePage from "@/app/upgrade/page";
import { useStorage } from "@/hooks/api/useStorage";
import StorageIndicator from "../ui/storage-indicator";
import { Input } from "../ui/input";


const SIDEBAR_WIDTH = 256
const SIDEBAR_WIDTH_COLLAPSED = 64

interface SiteHeaderProps {
  children: ReactNode;
}

export function SiteHeader({ children }: SiteHeaderProps) {
  const { tenants, currentTenant, setCurrentTenant } = useTenants()
  const { referrals } = useReferrals()
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { show, hide } = useDialog();
  const {
    projects: { data: personalProjects = [] },
    tenantProjects: { data: tenantProjects = [] },
    deleteProject: { mutateAsync: deleteProject },
  } = useProjects();


  const projects = [...personalProjects, ...tenantProjects]

  const {
    stats: { data: storageStats },
  } = useStorage();

  const {
    authUrl,
    stats: { data: dropboxStats },
  } = useDropbox();

  const isActive = (path: string) => pathname === path;

  const sidebarItems =
    [...(currentTenant && !!tenantProjects.length ? tenantProjects : personalProjects)]
      .filter((project) => project.status === "created")
      .filter((project) =>
        search
          ? project.name.toLowerCase().includes(search.toLowerCase())
          : true
      )
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

  const handleClickReferral = () => {
    show({
      title: "Referrals",
      content: () => <MakeReferralComponent />,
    })
  }

  const handleClickUpgrade = () => {
    show({
      title: "Upgrade",
      content: () => <UpgradePage />,
      containerProps: { className: "max-w-[90%]" }
    })
  }

  if (!user?.user_id) return <>{children}</>;

  return (
    <div className="flex h-dvh">
      {/* Sidebar */}
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{
          opacity: 1,
          width: isSidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH,
        }}
        className="bg-transparent border-r border-white/10 flex flex-col overflow-hidden w-full"
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
            <div className="mb-3">
              <AnimatePresence mode="wait">
                {isSidebarCollapsed ? (
                  <motion.div
                    key="icon"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className={`flex h-9 items-center px-3 rounded-lg transition-all hover:bg-white/10 cursor-pointer`}
                    onClick={() => {
                      setIsSidebarCollapsed(false)
                      // wait a bit so React renders the Input
                      setTimeout(() => {
                        requestAnimationFrame(() => {
                          searchInputRef.current?.focus();
                        });
                      }, 300)
                    }}
                  >
                    <Search width={20} height={20} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="input"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="h-9"
                  >
                    <Input
                      ref={searchInputRef}
                      type="search"
                      placeholder="Search Projects"
                      value={search}
                      autoComplete="off"
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {!!sidebarItems.length ? (
              <>
                {sidebarItems.map((item, index) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${isActive(item.href)
                      ? "bg-white/5 text-white"
                      : "text-white/80 hover:bg-white/10"
                      }`}
                  >
                    {/* Icon */}
                    <motion.div initial={false} animate={{ opacity: 1 }}>
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
                        "cursor-pointer absolute right-3 opacity-0 group-hover:opacity-100 text-white/60 hover:text-destructive-foreground transition-[opacity,colors] duration-200",
                        isSidebarCollapsed ? "hidden" : "block"
                      )}
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  </Link>
                ))}
              </>
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
                No projects {search ? "found" : "added"}
              </motion.span>
            )}
          </div>
          {/* Avatar at the bottom */}
          <div className="mt-4 pt-4 border-t border-white/10 place-items-start">
            <Button variant="outline" className="relative mb-4 w-full" onClick={handleClickReferral}>
              <AnimatePresence>
                {!!referrals && referrals.length <= MAX_REFERRALS_AMOUNT && (
                  <motion.div
                    className="absolute w-2 h-2 bg-red-500 rounded-full -top-1 -right-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </AnimatePresence>
              <Mails width={24} height={24} style={isSidebarCollapsed ? { marginLeft: "0px" } : { marginLeft: "4px" }} />
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
                Make Referral
              </motion.span>
            </Button>
            <Button variant="outline" className="relative mb-4 w-full" onClick={handleClickUpgrade}>
              <CircleFadingArrowUp width={24} height={24} style={isSidebarCollapsed ? { marginLeft: "0px" } : { marginLeft: "4px" }} />
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
                Upgrade
              </motion.span>
            </Button>
            <Link href={"/new"}>
              <Button className="relative mb-4 w-full">
                <PlusSquare width={24} height={24} style={isSidebarCollapsed ? { marginLeft: "0px" } : { marginLeft: "4px" }} />
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
                  className="mb-4 flex items-center justify-start gap-2 p-2 w-full"
                  variant="ghost"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar as string} />
                    <AvatarFallback className="text-sm">
                      {getInitials(user?.first_name || "", user?.last_name || "")}
                    </AvatarFallback>
                  </Avatar>

                  <motion.span
                    className="text-muted-foreground"
                    animate={isSidebarCollapsed ? "hidden" : "visible"}
                    transition={{ duration: 0.1 }}
                    variants={{
                      visible: {
                        opacity: 1,
                        display: "block",
                        transition: {
                          opacity: { duration: 0.1, delay: 0.15 },
                          display: { delay: 0.15 },
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

                  <AnimatePresence mode="wait">
                    {!!tenants.length && !isSidebarCollapsed && (
                      <motion.div
                        key="chevron"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15, delay: 0.3 }}
                        className="ml-auto"
                      >
                        <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" style={{ width: `calc(${SIDEBAR_WIDTH}px - 0.75rem)` }}>
                {!!tenants.length && (
                  <>
                    {tenants.map((tenant) => (
                      <DropdownMenuItem
                        key={tenant.tenant_id}
                        onClick={() => setCurrentTenant(tenant)}
                        className="flex items-start gap-2 w-full"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={tenant?.avatar as string} />
                          <AvatarFallback className="text-sm">
                            {getInitials(tenant?.name || "", "")}
                          </AvatarFallback>
                        </Avatar>
                        <span>{tenant.name}</span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      key={user.user_id}
                      onClick={() => setCurrentTenant(null)}
                      className="flex items-start gap-2 w-full"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar as string} />
                        <AvatarFallback className="text-sm">
                          {getInitials(user?.first_name || "", user?.last_name || "")}
                        </AvatarFallback>
                      </Avatar>
                      <span>{user.username}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem>
                  <Link href={"/preferences"} className="w-full h-full">
                    Preferences
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>
      </motion.div>

      {/* Main Content Area */}
      <div className="relative flex-1 flex flex-col overflow-hidden">
        <AnimatePresence>
          {!isSidebarCollapsed && (dropboxStats || storageStats) && (
            <motion.div
              className="absolute inset-0 bg-black/50 z-40 flex items-end justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="flex flex-col space-y-2 items-center w-[80%] mb-8 pointer-events-auto"
                initial={{ filter: "blur(20px)", opacity: 0, y: 30 }}
                animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                exit={{ filter: "blur(20px)", opacity: 0, y: 30 }}
                transition={{ delay: 0.5, duration: 0.5, staggerChildren: 0.1 }}

              >
                {storageStats && <StorageIndicator percentage={storageStats.used_percent} />}
                {dropboxStats && <StorageIndicator percentage={dropboxStats.used_percent} isDropbox />}
                {
                  authUrl.data && !user?.dropbox?.access_token && <>
                    <Button className="mt-1">Connect your Dropbox</Button></>
                }
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div >
  );
}
