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
} from "@/components/ui/sidebar";
import { getUser, logout } from "./utils/auth";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./ui/dropdown-menu";

import type { LucideIcon } from "lucide-react";
import { Users, Clock, User, Home, ChevronUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

/** Always return a Headers object (avoids TS unions) */
function authHeaders(): Headers {
  const h = new Headers();
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) h.set("Authorization", `Bearer ${token}`);
  return h;
}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const jwt = getUser(); // your util (decoded token or similar)
  const storedUsername =
    sessionStorage.getItem("username") || localStorage.getItem("username") || "";
  type SidebarItem = {
    id: string;
    label: string;
    icon: LucideIcon; 
    path: string;
  };
  /** Resolve username/email from storage or JWT claims */
  const username = useMemo(() => {
    if (storedUsername) return storedUsername;
    if (jwt) {
      // common claims you might have
      return (jwt.sub || jwt.email || jwt.username || "user@example.com").toString();
    }
    return "user@example.com";
  }, [storedUsername, jwt]);

  const name = (username || "User").toString();
  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+|@/).filter(Boolean).slice(0, 2);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }, [name]);

  /** Profile image URL fetched from backend */
  const [profileUrl, setProfileUrl] = useState<string | undefined>(undefined);

  // Fetch the user's profile (to get profilePicUrl) on mount / username change
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/users/${encodeURIComponent(username)}`,
          {
            method: "GET",
            headers: authHeaders(),
            credentials: "include",
          }
        );
        if (!res.ok) return;
        const data: { profilePicUrl?: string | null } = await res.json();
        if (!alive) return;
        setProfileUrl(data.profilePicUrl ?? undefined);
      } catch {
        // ignore silently; keep fallback avatar
      }
    })();
    return () => {
      alive = false;
    };
  }, [username]);

  const handleLogout = () => {
    logout();
    ["username", "email", "role"].forEach((k) => {
      sessionStorage.removeItem(k);
      localStorage.removeItem(k);
    });
    navigate("/login", { replace: true });
  };
  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([]);

  useEffect(() => {
    const username = localStorage['role'];
    console.log(username)

    if (username === "STAFF") {
      setSidebarItems([
        { id: "dashboard", label: "Dashboard", icon: Home, path: "/dashboard" },
        { id: "sessions", label: "Sessions", icon: Clock, path: "/sessions" },
        { id: "rosters", label: "Rosters", icon: Users, path: "/rosters" },
        { id: "students", label: "Students", icon: User, path: "/students" }]);
    } else {
      setSidebarItems([
        { id: "enrol", label: "Enrol for Class", icon: Home, path: "/enrolStudent" },
      ]);
    }
  }, []); // run once on mount


  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Smart Attendance System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-3 mt-5">
              {sidebarItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
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
                );
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
                      src={
                        profileUrl ||
                        "https://github.com/shadcn.png"
                      }
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
                <DropdownMenuItem
                  className="hover:cursor-pointer rounded"
                  onClick={handleLogout}
                >
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
