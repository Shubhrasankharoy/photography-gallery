"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getProfileByUid } from "@/lib/profileService";
import StudioSwitcher from "@/components/StudioSwitcher";
import SearchTrigger from "@/components/SearchTrigger";
import useSearchManager from "@/hooks/useSearchManager";
import { motion, AnimatePresence } from "motion/react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  const dropdownRef = useRef(null);

  // Scroll detection for transparent → solid navbar
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch username for active photographer
  useEffect(() => {
    if (user) {
      getProfileByUid(user.uid)
        .then((profile) => {
          if (profile && profile.username) {
            setUsername(profile.username);
          } else {
            setUsername("");
          }
        })
        .catch((err) => {
          console.error("Error fetching username in Navbar:", err);
          setUsername("");
        });
    } else {
      // Defer state update to avoid synchronous setState inside the effect body
      Promise.resolve().then(() => setUsername(""));
    }
  }, [user]);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Photographers", href: "/photographers" },
    { name: "Events", href: "/events" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  const isActive = (path) => pathname === path;

  // Handle clicking outside the profile dropdown to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await logout();
      setIsDropdownOpen(false);
      setIsOpen(false);
      router.push("/login");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // Get user display initial
  const getUserInitial = () => {
    if (!user) return "U";
    if (user.displayName) return user.displayName.charAt(0).toUpperCase();
    if (user.email) return user.email.charAt(0).toUpperCase();
    return "U";
  };

  const { setIsModalOpen } = useSearchManager();

  if (pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin")) return null;

  return (
    <nav
      className={`sticky top-0 z-50 w-full border-b backdrop-blur-md transition-all duration-300 ${
        scrolled
          ? "border-zinc-200/50 bg-white/80 dark:border-zinc-800/50 dark:bg-[#181818]/80 shadow-sm"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo — Playfair + Inter per DESIGN.md */}
          <div className="flex items-center gap-4 shrink-0">
            <Link href="/" className="group flex items-center space-x-1.5">
              <span className="font-headline text-xl font-bold tracking-wider text-[#D4AF37]">
                CAPTURE
              </span>
              <span className="font-body text-xl font-light tracking-widest text-zinc-800 dark:text-zinc-200">
                SPACE
              </span>
            </Link>

            {user && (
              <div className="hidden md:block pl-4 border-l border-zinc-200 dark:border-zinc-800">
                <StudioSwitcher />
              </div>
            )}
          </div>

          {/* Search Trigger (Desktop) */}
          <div className="hidden md:block flex-1 max-w-xs mx-6">
            <SearchTrigger />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`relative text-sm font-medium transition-colors duration-200 hover:text-[#D4AF37] ${
                  isActive(link.href)
                    ? "text-[#D4AF37]"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {link.name}
                {isActive(link.href) && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute -bottom-5 left-0 h-0.5 w-full bg-[#D4AF37]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            ))}

            {user && (
              <Link
                href="/dashboard"
                className={`relative text-sm font-medium transition-colors duration-200 hover:text-[#D4AF37] ${
                  isActive("/dashboard")
                    ? "text-[#D4AF37]"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                Dashboard
                {isActive("/dashboard") && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute -bottom-5 left-0 h-0.5 w-full bg-[#D4AF37]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            )}

            {user ? (
              /* User Dropdown Ref wrapper */
              <div className="relative" ref={dropdownRef}>
                <motion.span
                  role="button"
                  tabIndex={0}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setIsDropdownOpen(!isDropdownOpen);
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D4AF37] text-[#181818] font-bold text-sm tracking-wider cursor-pointer shadow-sm border border-[#D4AF37]/20 select-none"
                  suppressHydrationWarning
                >
                  {getUserInitial()}
                </motion.span>
                
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute right-0 mt-3 w-56 rounded-[20px] border border-zinc-200 bg-white p-2 shadow-[var(--shadow-lg)] dark:border-zinc-800 dark:bg-[#262626]"
                    >
                      <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-700/50">
                        <p className="text-xs text-[#8E8E8E]">Signed in as</p>
                        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate mt-0.5">
                          {user?.displayName || user?.email}
                        </p>
                      </div>
                      
                      <div className="mt-2 space-y-1">
                        <Link
                          href="/dashboard"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex w-full items-center rounded-[12px] px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-[#2D2D2D]"
                        >
                          Dashboard
                        </Link>
                        {username && (
                          <Link
                            href={`/photographer/${username}`}
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex w-full items-center rounded-[12px] px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-[#2D2D2D]"
                          >
                            View Profile
                          </Link>
                        )}
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={handleSignOut}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") handleSignOut();
                          }}
                          className="flex w-full items-center rounded-[12px] px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20 cursor-pointer select-none"
                        >
                          Sign Out
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/login"
                  className="relative inline-flex items-center justify-center overflow-hidden rounded-[12px] bg-[#D4AF37] px-5 py-2 text-sm font-semibold text-[#181818] transition-all duration-150 hover:bg-[#E0C55B] hover:shadow-lg hover:shadow-[#D4AF37]/10"
                >
                  Sign In
                </Link>
              </motion.div>
            )}
          </div>

          {/* Mobile menu and search buttons */}
          <div className="flex md:hidden items-center gap-1.5">
            <button
              onClick={() => setIsModalOpen(true)}
              type="button"
              className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100 focus:outline-hidden"
              aria-label="Open Search Command Palette"
            >
              <svg className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            <button

              onClick={() => setIsOpen(!isOpen)}
              type="button"
              suppressHydrationWarning
              className="inline-flex items-center justify-center rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <svg
                  className="h-6 w-6 transition-transform duration-200 rotate-90"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6 transition-transform duration-200"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-sm border-l border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-[#181818] md:hidden"
          >
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center space-x-1.5" onClick={() => setIsOpen(false)}>
                <span className="font-headline text-lg font-bold tracking-wider text-[#D4AF37]">
                  CAPTURE
                </span>
                <span className="font-body text-lg font-light tracking-widest text-zinc-800 dark:text-zinc-200">
                  SPACE
                </span>
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                suppressHydrationWarning
                className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-8 flex flex-col space-y-4">
              {user && (
                <div className="px-4 pb-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-col gap-1.5">
                  <span className="text-[10px] text-[#8E8E8E] font-bold uppercase tracking-wider">Active Workspace</span>
                  <StudioSwitcher />
                </div>
              )}

              {navLinks.map((link, i) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`rounded-[12px] px-4 py-3 text-base font-semibold transition-colors duration-150 hover:bg-zinc-100 dark:hover:bg-[#2D2D2D] block ${
                      isActive(link.href)
                        ? "bg-[#D4AF37]/10 text-[#D4AF37]"
                        : "text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
              
              {user && (
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className={`rounded-[12px] px-4 py-3 text-base font-semibold transition-colors duration-150 hover:bg-zinc-100 dark:hover:bg-[#2D2D2D] ${
                    isActive("/dashboard")
                      ? "bg-[#D4AF37]/10 text-[#D4AF37]"
                      : "text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  Dashboard
                </Link>
              )}
              
              {user && username && (
                <Link
                  href={`/photographer/${username}`}
                  onClick={() => setIsOpen(false)}
                  className={`rounded-[12px] px-4 py-3 text-base font-semibold transition-colors duration-150 hover:bg-zinc-100 dark:hover:bg-[#2D2D2D] ${
                    isActive(`/photographer/${username}`)
                      ? "bg-[#D4AF37]/10 text-[#D4AF37]"
                      : "text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  View Profile
                </Link>
              )}

              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                {user ? (
                  <div className="space-y-3">
                    <div className="px-4 py-2">
                      <p className="text-xs text-[#8E8E8E]">Signed in as</p>
                      <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate mt-0.5">
                        {user?.displayName || user?.email}
                      </p>
                    </div>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={handleSignOut}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") handleSignOut();
                      }}
                      className="flex w-full items-center justify-center rounded-[12px] bg-rose-600 py-3 text-center text-sm font-semibold text-white transition-all duration-200 hover:bg-rose-500 cursor-pointer select-none"
                    >
                      Sign Out
                    </span>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex w-full items-center justify-center rounded-[12px] bg-[#D4AF37] py-3 text-center text-sm font-semibold text-[#181818] transition-all duration-200 hover:bg-[#E0C55B]"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
