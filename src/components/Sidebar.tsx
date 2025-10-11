// // src/components/Sidebar.tsx
// import { Users, Clock, Settings, FileText, User, BarChart3, LogOut, Home } from "lucide-react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { getUser, logout } from "./utils/auth";
// import { cn } from "@/lib/utils";
// import { Button } from "@/components/ui/button";
// import { Separator } from "@/components/ui/separator";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// interface SidebarProps {
//   className?: string;
// }

// export default function Sidebar({ className }: SidebarProps) {
//   const navigate = useNavigate();
//   const location = useLocation();

//   // fresh user values
//   const jwt = getUser();
//   const storedUsername =
//     sessionStorage.getItem("username") || localStorage.getItem("username") || "";
//   const storedEmail =
//     sessionStorage.getItem("email") || localStorage.getItem("email") || "";

//   const name = (storedUsername || (jwt?.sub ?? "") || "User").toString();
//   const email = (storedEmail || (jwt?.sub ?? "")).toString();

//   const initials = (() => {
//     const parts = name.trim().split(/\s+/).slice(0, 2);
//     if (parts.length === 0) return "U";
//     if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
//     return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
//   })();

//   const sidebarItems = [
//     { id: "dashboard", label: "Dashboard", icon: Home, path: "/dashboard" },
//     { id: "sessions",  label: "Sessions",  icon: Clock, path: "/sessions" },
//     { id: "rosters",   label: "Rosters",   icon: Users, path: "/rosters" },
//     { id: "students",  label: "Students",  icon: User, path: "/students" },
//     { id: "settings",  label: "Settings",  icon: Settings, path: "/settings" },
//   ] as const;

//   const isActivePath = (targetPath: string) =>
//     location.pathname === targetPath || location.pathname.startsWith(targetPath + "/");

//   const handleLogout = () => {
//     logout();
//     ["username", "email", "role"].forEach((k) => {
//       sessionStorage.removeItem(k);
//       localStorage.removeItem(k);
//     });
//     navigate("/login", { replace: true });
//   };

//   return (
//     <aside
//       className={cn(
//         "w-64 shrink-0 border-r p-2",
//         "flex h-auto flex-col", // full-height column layout
//         className
//       )}
//     >
//       {/* Header / Profile */}
//       <div className="p-4">
//         <div className="flex items-center gap-3">
//           <Avatar className="h-9 w-9">
//             <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
//               {initials}
//             </AvatarFallback>
//           </Avatar>
//           <div className="min-w-0">
//             <p className="truncate text-sm font-medium">{name}</p>
//             <p className="truncate text-xs text-muted-foreground">{email}</p>
//           </div>
//         </div>
//       </div>

//       <Separator className="bg-sidebar-border" />

//       {/* Nav */}
//       <nav className="flex-1 py-2">
//         {sidebarItems.map((item) => {
//           const Icon = item.icon;
//           const active = isActivePath(item.path);
//           return (
//             <Button
//               key={item.id}
//               variant="ghost"
//               className={cn(
//                 "w-full justify-start gap-3 rounded-none px-6 py-6",
//                 "text-sm font-normal",
//                 active
//                   ? "bg-sidebar-accent text-sidebar-accent-foreground border-r-2 border-sidebar-ring"
//                   : "text-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
//               )}
//               onClick={() => navigate(item.path)}
//             >
//               <Icon size={18} className="shrink-0" />
//               <span className="truncate">{item.label}</span>
//             </Button>
//           );
//         })}
//       </nav>

//       <Separator className="bg-sidebar-border" />

//       {/* Footer / Logout */}
//       <div className="p-4">
//         <Button
//           variant="ghost"
//           className="w-full justify-start gap-2"
//           onClick={handleLogout}
//         >
//           <LogOut size={16} />
//           <span>Sign Out</span>
//         </Button>
//       </div>
//     </aside>
//   );
// }
