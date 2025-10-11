// src/components/ProtectedLayout.tsx
import { Outlet } from "react-router-dom";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"




export default function ProtectedLayout() {

  return (
    // <div className="min-h-screen  flex flex-row bg-background text-foreground">
    //   <Sidemenu />
    //   <div className="flex-1">
    //     <Outlet />
    //   </div>
    // </div>
    <SidebarProvider>
      <AppSidebar />
      <SidebarTrigger className="hover:cursor-pointer hover:scale-110"/>
      <main className="w-full ">
        
        
         <Outlet/>
      </main>
    </SidebarProvider>
  );
}
