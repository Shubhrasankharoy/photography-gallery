"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { useNotifications } from "@/context/NotificationContext";

export default function DashboardSidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await logout();
      if (onClose) onClose();
      router.push("/login");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      ),
      active: pathname === "/dashboard",
      locked: false,
    },
    {
      name: "Events",
      href: "/dashboard/events",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      active: pathname === "/dashboard/events" || pathname.startsWith("/dashboard/events/"),
      locked: false,
    },
    {
      name: "Uploads",
      href: "/dashboard/uploads",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      ),
      active: pathname === "/dashboard/uploads",
      locked: false,
    },
    {
      name: "Studio",
      href: "/dashboard/studio",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      active: pathname === "/dashboard/studio" || pathname.startsWith("/dashboard/studio/"),
      locked: false,
    },
    {
      name: "Notifications",
      href: "/dashboard/notifications",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      active: pathname === "/dashboard/notifications",
      locked: false,
      badge: unreadCount > 0 ? unreadCount : null
    },
    {
      name: "Activity Timeline",
      href: "/dashboard/activity",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      active: pathname === "/dashboard/activity",
      locked: false,
    },
    {
      name: "Trash & Recovery",
      href: "/dashboard/trash",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      active: pathname === "/dashboard/trash",
      locked: false,
    },
    {
      name: "Profile Settings",
      href: "/dashboard/profile",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      active: pathname === "/dashboard/profile",
      locked: false,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      active: pathname === "/dashboard/settings",
      locked: false,
    },
    {
      name: "Analytics",
      href: "/dashboard/analytics",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2h-2a2 2 0 01-2-2zm9-1V4a2 2 0 00-2-2h-2a2 2 0 00-2 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
        </svg>
      ),
      active: pathname === "/dashboard/analytics",
      locked: false,
    },
  ];

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    async function checkAdmin() {
      try {
        const res = await fetch("/api/admin/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: user.uid }),
        });
        const data = await res.json();
        if (data.isAdmin) {
          setIsAdmin(true);
        }
      } catch (err) {
        console.error("Error verifying admin status:", err);
      }
    }
    checkAdmin();
  }, [user]);

  const activeNavItems = [...navItems];
  if (isAdmin) {
    activeNavItems.push({
      name: "Admin Panel",
      href: "/admin",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
      active: pathname.startsWith("/admin"),
      locked: false,
    });
  }

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-zinc-950/20 backdrop-blur-xs dark:bg-black/40 lg:hidden"
        />
      )}

      {/* Sidebar Sidebar content */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col justify-between border-r border-zinc-250 bg-[#F7F7F7] px-6 py-6 dark:border-zinc-800/40 dark:bg-[#202020] transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        
        <div className="flex flex-col space-y-8">
          
          {/* Logo Brand row */}
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-1.5">
              <span className="font-headline text-xl font-bold tracking-wider text-[#D4AF37]">
                CAPTURE
              </span>
              <span className="font-body text-xl font-light tracking-widest text-zinc-800 dark:text-zinc-200">
                SPACE
              </span>
            </Link>
            
            <button
              onClick={onClose}
              type="button"
              className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 lg:hidden"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Nav List */}
          <nav className="flex flex-col space-y-1.5">
            {activeNavItems.map((item) => (
              <span key={item.name} className="block w-full">
                {item.locked ? (
                  <div className="flex items-center justify-between rounded-[12px] px-4 py-3 text-sm font-semibold text-zinc-400 dark:text-zinc-600 select-none cursor-not-allowed">
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.name}</span>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest bg-zinc-200 dark:bg-zinc-900 text-zinc-500 px-1.5 py-0.5 rounded-sm">
                      {item.phase}
                    </span>
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center justify-between rounded-[12px] px-4 py-3 text-sm font-bold transition-all duration-150 ${
                      item.active
                        ? "bg-[#D4AF37] text-[#181818] shadow-md shadow-[#D4AF37]/10"
                        : "text-zinc-500 hover:bg-zinc-200/50 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-[#2D2D2D]/60 dark:hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )}
              </span>
            ))}
          </nav>
        </div>


        {/* Footer Profile Box */}
        <div className="pt-6 border-t border-zinc-250 dark:border-zinc-800/60 flex flex-col space-y-4">
          {user && (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D4AF37] text-[#181818] font-bold text-sm select-none">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : "P"}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate leading-tight">
                  {user.displayName || "Photographer"}
                </span>
                <span className="text-[11px] text-[#8E8E8E] truncate font-light leading-none mt-0.5">
                  {user.email}
                </span>
              </div>
            </div>
          )}

          <span
            role="button"
            tabIndex={0}
            onClick={handleSignOut}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleSignOut();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-[12px] border border-zinc-250 bg-white hover:bg-zinc-50 dark:border-zinc-800/40 dark:bg-[#262626] dark:hover:bg-[#2D2D2D] py-3 text-xs font-bold text-rose-600 cursor-pointer select-none transition-all duration-150"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            <span>Sign Out</span>
          </span>
        </div>

      </aside>
    </>
  );
}
