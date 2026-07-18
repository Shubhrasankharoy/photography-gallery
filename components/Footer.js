"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function Footer() {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState("");

  if (pathname?.startsWith("/dashboard")) return null;

  const handleSubscribe = (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Email address is required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Success Mock State
    setSubscribed(true);
    setEmail("");
    setTimeout(() => {
      setSubscribed(false);
    }, 4000);
  };

  return (
    <footer className="w-full border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-black transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="flex flex-col space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <span className="bg-linear-to-r from-violet-600 to-indigo-600 bg-clip-text text-lg font-bold tracking-wider text-transparent dark:from-violet-400 dark:to-indigo-400">
                CAPTURE
              </span>
              <span className="text-lg font-light tracking-widest text-zinc-800 dark:text-zinc-200">
                SPACE
              </span>
            </Link>
            <p className="text-sm text-zinc-650 dark:text-zinc-400 leading-relaxed max-w-xs">
              A premium, AI-driven photography gallery platform designed for professional creators to present, secure, and deliver their visual narratives.
            </p>
            {/* Social Icons */}
            <div className="flex space-x-4 pt-2">
              {/* Instagram */}
              <a href="#" className="text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                <span className="sr-only">Instagram</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.01 3.752.054 2.6.12 3.63 1.137 3.752 3.752.043.967.054 1.32.054 3.752 0 2.43-.01 2.78-.054 3.752-.12 2.602-1.14 3.63-3.752 3.752-.967.043-1.32.054-3.752.054-2.43 0-2.78-.01-3.752-.054-2.6-.12-3.63-1.137-3.752-3.752-.043-.967-.054-1.32-.054-3.752 0-2.43.01-2.78.054-3.752.12-2.6 1.14-3.63 3.752-3.752.967-.043 1.32-.054 3.752-.054L12.315 2zm-1.077 1.8c-2.405 0-2.69.01-3.637.054-.233.01-.397.047-.538.102-.146.057-.27.133-.393.256-.123.123-.2.247-.256.393-.055.14-.092.305-.102.538-.044.947-.054 1.232-.054 3.637 0 2.405.01 2.69.054 3.637.01.233.047.397.102.538.057.146.133.27.256.393.123.123.247.2.393.256.14.055.305.092.538.102.947.044 1.232.054 3.637.054 2.405 0 2.69-.01 3.637-.054.233-.01.397-.047.538-.102.146-.057.27-.133.393-.256.123-.123.2-.247.256-.393.055-.14.092-.305.102-.538.044-.947.054-1.232.054-3.637 0-2.405-.01-2.69-.054-3.637-.01-.233-.047-.397-.102-.538-.057-.146-.133-.27-.256-.393-.123-.123-.247-.2-.393-.256-.14-.055-.305-.092-.538-.102-.947-.044-1.232-.054-3.637-.054zM12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" clipRule="evenodd" />
                </svg>
              </a>
              {/* Twitter */}
              <a href="#" className="text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              {/* Dribbble / Portfolio */}
              <a href="#" className="text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                <span className="sr-only">Portfolio</span>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Pages</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/" className="text-sm text-zinc-650 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors">Home</Link>
              </li>
              <li>
                <Link href="/photographers" className="text-sm text-zinc-650 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors">Photographers</Link>
              </li>
              <li>
                <Link href="/events" className="text-sm text-zinc-650 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors">Events</Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-zinc-650 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors">About</Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-zinc-650 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors">Contact</Link>
              </li>
              <li>
                <Link href="/login" className="text-sm text-zinc-650 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors">Client Login</Link>
              </li>
            </ul>
          </div>

          {/* Features Placeholders */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Features</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <span className="text-sm text-zinc-500 cursor-not-allowed">AI Face Search</span>
              </li>
              <li>
                <span className="text-sm text-zinc-500 cursor-not-allowed">Client Proofing</span>
              </li>
              <li>
                <span className="text-sm text-zinc-500 cursor-not-allowed">Google Drive Sync</span>
              </li>
              <li>
                <span className="text-sm text-zinc-500 cursor-not-allowed">Secure Archiving</span>
              </li>
            </ul>
          </div>

          {/* Newsletter Form */}
          <div className="flex flex-col space-y-3">
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Subscribe</h3>
            <p className="text-sm text-zinc-650 dark:text-zinc-400">Get platform updates and creative insights direct to your inbox.</p>
            <div className="flex flex-col space-y-2">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSubscribe(e);
                    }
                  }}
                  placeholder="Enter email address"
                  className="w-full rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-600 dark:focus:border-indigo-400 dark:focus:ring-indigo-400 transition-colors"
                />
              </div>
              <span
                role="button"
                tabIndex={0}
                onClick={handleSubscribe}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleSubscribe(e);
                  }
                }}
                className="w-full text-center cursor-pointer select-none rounded-full bg-indigo-600 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 block"
              >
                Join Newsletter
              </span>
            </div>
            {error && <span className="text-xs font-medium text-rose-500">{error}</span>}
            {subscribed && (
              <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5 animate-pulse">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Subscription active! Check your inbox.
              </span>
            )}
          </div>
        </div>

        <div className="mt-12 border-t border-zinc-200 pt-8 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-600">&copy; 2026 CaptureSpace. All rights reserved.</p>
          <div className="flex space-x-6 text-xs text-zinc-500 dark:text-zinc-600">
            <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
