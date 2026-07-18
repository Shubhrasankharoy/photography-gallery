"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AdminSidebar({ isOpen, onClose }) {
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
      name: "Overview",
      href: "/admin",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      ),
      active: pathname === "/admin",
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      active: pathname === "/admin/users",
    },
    {
      name: "Photographers",
      href: "/admin/photographers",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      active: pathname === "/admin/photographers",
    },
    {
      name: "Events",
      href: "/admin/events",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      active: pathname === "/admin/events",
    },
    {
      name: "Delete Content",
      href: "/admin/content",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      active: pathname === "/admin/content",
    },
    {
      name: "Reports",
      href: "/admin/reports",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      active: pathname === "/admin/reports",
    },
    {
      name: "Storage Overview",
      href: "/admin/storage",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
      active: pathname === "/admin/storage",
    },
    {
      name: "Search Everything",
      href: "/admin/search",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      active: pathname === "/admin/search",
    },
  ];

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-zinc-950/20 backdrop-blur-xs dark:bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col justify-between border-r border-zinc-200 bg-zinc-50 px-6 py-6 dark:border-zinc-850 dark:bg-zinc-950/30 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col space-y-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <span className="bg-linear-to-r from-rose-600 to-red-600 bg-clip-text text-xl font-bold tracking-wider text-transparent dark:from-rose-400 dark:to-red-400">
                SYSTEM
              </span>
              <span className="text-xl font-light tracking-widest text-zinc-800 dark:text-zinc-200">
                ADMIN
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

          <nav className="flex flex-col space-y-1.5">
            {navItems.map((item) => (
              <span key={item.name} className="block w-full">
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                    item.active
                      ? "bg-rose-600 text-white shadow-md shadow-rose-650/15"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-450 dark:hover:bg-zinc-900 dark:hover:text-white"
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              </span>
            ))}
          </nav>
        </div>

        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-850 flex flex-col space-y-4">
          <Link
            href="/dashboard"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-250 bg-white hover:bg-zinc-50 dark:border-zinc-850 dark:bg-zinc-950 dark:hover:bg-zinc-900 py-3 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-all"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Dashboard</span>
          </Link>

          {user && (
            <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-900 p-2.5 rounded-xl">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-600 text-white font-bold text-sm">
                {user.displayName ? user.displayName.charAt(0) : "A"}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate leading-tight">
                  {user.displayName || "Admin User"}
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
