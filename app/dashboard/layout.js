"use client";

import { useState } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { NotificationProvider } from "@/context/NotificationContext";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-zinc-50 dark:bg-black transition-colors duration-300">
        
        {/* Dashboard Left Navigation Drawer */}
        <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content grid area */}
        <div className="lg:pl-72 flex flex-col min-h-screen">
          
          {/* Dashboard Top Header Bar */}
          <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />

          {/* Dashboard inner routes children */}
          <main className="grow">
            {children}
          </main>
        </div>

      </div>
    </NotificationProvider>
  );
}
