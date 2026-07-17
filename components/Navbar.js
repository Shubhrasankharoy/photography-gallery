"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getProfileByUid } from "@/lib/profileService";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [username, setUsername] = useState("");
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  const dropdownRef = useRef(null);

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

  if (pathname?.startsWith("/dashboard")) return null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-200/50 bg-white/70 backdrop-blur-md dark:border-zinc-800/50 dark:bg-black/70 transition-all duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="shrink-0">
            <Link href="/" className="group flex items-center space-x-2">
              <span className="bg-linear-to-r from-violet-600 to-indigo-600 bg-clip-text text-xl font-bold tracking-wider text-transparent dark:from-violet-400 dark:to-indigo-400">
                CAPTURE
              </span>
              <span className="text-xl font-light tracking-widest text-zinc-800 dark:text-zinc-200">
                SPACE
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`relative text-sm font-medium transition-colors duration-200 hover:text-indigo-600 dark:hover:text-indigo-400 ${
                  isActive(link.href)
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {link.name}
                {isActive(link.href) && (
                  <span className="absolute -bottom-5 left-0 h-0.5 w-full bg-linear-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400" />
                )}
              </Link>
            ))}

            {user && (
              <Link
                href="/dashboard"
                className={`relative text-sm font-medium transition-colors duration-200 hover:text-indigo-600 dark:hover:text-indigo-400 ${
                  isActive("/dashboard")
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                Dashboard
                {isActive("/dashboard") && (
                  <span className="absolute -bottom-5 left-0 h-0.5 w-full bg-linear-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400" />
                )}
              </Link>
            )}

            {user ? (
              /* User Dropdown Ref wrapper */
              <div className="relative" ref={dropdownRef}>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setIsDropdownOpen(!isDropdownOpen);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-sm tracking-wider cursor-pointer hover:bg-indigo-500 shadow-sm border border-indigo-500/20 select-none"
                  suppressHydrationWarning
                >
                  {getUserInitial()}
                </span>
                
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 rounded-2xl border border-zinc-200 bg-white p-2 shadow-2xl dark:border-zinc-850 dark:bg-zinc-950 animate-fade-in">
                    <div className="px-4 py-3 border-b border-zinc-150 dark:border-zinc-900">
                      <p className="text-xs text-zinc-400">Signed in as</p>
                      <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate mt-0.5">
                        {user?.displayName || user?.email}
                      </p>
                    </div>
                    
                    <div className="mt-2 space-y-1">
                      <Link
                        href="/dashboard"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex w-full items-center rounded-lg px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-350 dark:hover:bg-zinc-900"
                      >
                        Dashboard
                      </Link>
                      {username && (
                        <Link
                          href={`/photographer/${username}`}
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex w-full items-center rounded-lg px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-350 dark:hover:bg-zinc-900"
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
                        className="flex w-full items-center rounded-lg px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-455 dark:hover:bg-rose-950/20 cursor-pointer select-none"
                      >
                        Sign Out
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="relative inline-flex items-center justify-center overflow-hidden rounded-full bg-zinc-950 px-5 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-zinc-800 hover:shadow-lg hover:shadow-indigo-500/10 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200 dark:hover:shadow-indigo-400/10"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              suppressHydrationWarning
              className="inline-flex items-center justify-center rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
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
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-950/20 backdrop-blur-sm dark:bg-black/40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Navigation Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-sm border-l border-zinc-200 bg-white p-6 shadow-2xl transition-transform duration-300 ease-in-out dark:border-zinc-850 dark:bg-zinc-950 md:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2" onClick={() => setIsOpen(false)}>
            <span className="bg-linear-to-r from-violet-600 to-indigo-600 bg-clip-text text-lg font-bold tracking-wider text-transparent dark:from-violet-400 dark:to-indigo-400">
              CAPTURE
            </span>
            <span className="text-lg font-light tracking-widest text-zinc-800 dark:text-zinc-200">
              SPACE
            </span>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            suppressHydrationWarning
            className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-150 dark:hover:bg-zinc-900"
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
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={`rounded-lg px-4 py-3 text-base font-semibold transition-colors duration-150 hover:bg-zinc-100 dark:hover:bg-zinc-900 ${
                isActive(link.href)
                  ? "bg-indigo-50/50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400"
                  : "text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {link.name}
            </Link>
          ))}
          
          {user && (
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className={`rounded-lg px-4 py-3 text-base font-semibold transition-colors duration-150 hover:bg-zinc-100 dark:hover:bg-zinc-900 ${
                isActive("/dashboard")
                  ? "bg-indigo-50/50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400"
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
              className={`rounded-lg px-4 py-3 text-base font-semibold transition-colors duration-150 hover:bg-zinc-100 dark:hover:bg-zinc-900 ${
                isActive(`/photographer/${username}`)
                  ? "bg-indigo-50/50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400"
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
                  <p className="text-xs text-zinc-400">Signed in as</p>
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
                  className="flex w-full items-center justify-center rounded-full bg-rose-600 py-3 text-center text-sm font-semibold text-white transition-all duration-200 hover:bg-rose-500 cursor-pointer select-none"
                >
                  Sign Out
                </span>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="flex w-full items-center justify-center rounded-full bg-zinc-950 py-3 text-center text-sm font-semibold text-white transition-all duration-200 hover:bg-zinc-850 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
