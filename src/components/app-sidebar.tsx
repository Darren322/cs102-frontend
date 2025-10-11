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

import { Users, Clock, Settings, User, Home, ChevronUp } from "lucide-react"
import { useLocation, Link, useNavigate } from "react-router-dom"
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";

export function AppSidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const jwt = getUser();
    const storedUsername =
        sessionStorage.getItem("username") || localStorage.getItem("username") || "";

    const name = (storedUsername || (jwt?.sub ?? "") || "User").toString();
    const initials = (() => {
        const parts = name.trim().split(/\s+/).slice(0, 2);
        if (parts.length === 0) return "U";
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    })();

    const handleLogout = () => {
        logout();
        ["username", "email", "role"].forEach((k) => {
            sessionStorage.removeItem(k);
            localStorage.removeItem(k);
        });
        navigate("/login", { replace: true });
    };

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
                                    <Avatar className="h-7 w-7 rounded-full shrink-0">
                                        <AvatarImage
                                            src="https://github.com/shadcn.png"
                                            alt={name}
                                            className="h-7 w-7 rounded-full object-cover"
                                        />
                                        <AvatarFallback className="h-7 w-7 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center text-sm font-medium">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">{name}</p>
                                    </div>
                                    <ChevronUp className="ml-auto " />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                side="top"
                                className="min-w-0 w-[var(--radix-popper-anchor-width)] rounded"
                            >
                                <DropdownMenuItem className="hover:cursor-pointer rounded">
                                    <Link to="/account" className="w-full">
                                        Account
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="hover:cursor-pointer rounded" onClick={handleLogout}>
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
