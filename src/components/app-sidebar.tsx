import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { getUser, logout } from "./utils/auth";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "./ui/dropdown-menu"

import { Users, Clock, Settings, User, Home, User2, ChevronUp } from "lucide-react"
import { useLocation, Link } from "react-router-dom"

export function AppSidebar() {
    const location = useLocation()

    const jwt = getUser();
    const storedUsername =
        sessionStorage.getItem("username") || localStorage.getItem("username") || "";

    const name = (storedUsername || (jwt?.sub ?? "") || "User").toString();




    const sidebarItems = [
        { id: "dashboard", label: "Dashboard", icon: Home, path: "/dashboard" },
        { id: "sessions", label: "Sessions", icon: Clock, path: "/sessions" },
        { id: "rosters", label: "Rosters", icon: Users, path: "/rosters" },
        { id: "students", label: "Students", icon: User, path: "/students" },
        { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
    ] as const

    return (
        <Sidebar>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Smart Attendance System</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-3 mt-5">
                            {sidebarItems.map((item) => {
                                const isActive = location.pathname.startsWith(item.path)
                                return (
                                    <SidebarMenuItem key={item.id}>
                                        <SidebarMenuButton
                                            asChild
                                            className="hover:cursor-pointer hover:scale-102 transition-transform rounded p-5"
                                            isActive={isActive}
                                        >
                                            <Link to={item.path}>
                                                <item.icon />
                                                <span>{item.label}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>

                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton className="rounded py-5 hover:cursor-pointer hover:scale-102 transition-transform">
                                    <User2 /> <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">{name}</p>
                                    </div>
                                    <ChevronUp className="ml-auto " />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                side="top"
                                className="min-w-0 w-[var(--radix-popper-anchor-width)] rounded"
                            >
                                <DropdownMenuItem className="hover:cursor-pointer rounded ">
                                    <span>Account</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="hover:cursor-pointer rounded">
                                    <span>Sign out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
