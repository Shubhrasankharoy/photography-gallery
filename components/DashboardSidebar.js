"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function DashboardSidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
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
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col justify-between border-r border-zinc-200 bg-zinc-50 px-6 py-6 dark:border-zinc-850 dark:bg-zinc-950/30 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        
        <div className="flex flex-col space-y-8">
          
          {/* Logo Brand row */}
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <span className="bg-linear-to-r from-violet-600 to-indigo-600 bg-clip-text text-xl font-bold tracking-wider text-transparent dark:from-violet-400 dark:to-indigo-400">
                CAPTURE
              </span>
              <span className="text-xl font-light tracking-widest text-zinc-800 dark:text-zinc-200">
                SPACE
              </span>
            </Link>
            
            <button
              onClick={onClose}
              type="button"
              className="rounded-full p-1 text-zinc-400 hover:bg-zinc-150 dark:hover:bg-zinc-900 lg:hidden"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Nav List */}
          <nav className="flex flex-col space-y-1.5">
            {navItems.map((item) => (
              <span key={item.name} className="block w-full">
                {item.locked ? (
                  <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-zinc-400 dark:text-zinc-600 select-none cursor-not-allowed">
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.name}</span>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest bg-zinc-100 dark:bg-zinc-900 text-zinc-500 px-1.5 py-0.5 rounded-sm">
                      {item.phase}
                    </span>
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                      item.active
                        ? "bg-indigo-650 text-white shadow-md shadow-indigo-600/10"
                        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-450 dark:hover:bg-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                )}
              </span>
            ))}
          </nav>
        </div>

        {/* Footer Profile Box */}
        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-850 flex flex-col space-y-4">
          {user && (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-sm">
                {user.displayName ? user.displayName.charAt(0) : "P"}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate leading-tight">
                  {user.displayName || "Photographer"}
                </span>
                <span className="text-[11px] text-zinc-450 truncate font-light leading-none">
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
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-250 bg-white hover:bg-zinc-50 dark:border-zinc-850 dark:bg-zinc-950 dark:hover:bg-zinc-900 py-3 text-xs font-bold text-rose-600 cursor-pointer select-none transition-all"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            <span>Sign Out</span>
          </span>
        </div>

      </aside>
    </>
  );
}
