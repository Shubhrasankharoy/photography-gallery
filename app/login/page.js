"use client";

import { useState } from "react";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [loginMethod, setLoginMethod] = useState(""); // 'email' or 'google'

  const validate = () => {
    const tempErrors = {};
    if (!email.trim()) {
      tempErrors.email = "Email address is required.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        tempErrors.email = "Please enter a valid email address.";
      }
    }

    if (!password) {
      tempErrors.password = "Password is required.";
    } else if (password.length < 6) {
      tempErrors.password = "Password must be at least 6 characters.";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleEmailLogin = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setLoginMethod("email");

    setTimeout(() => {
      setLoading(false);
      setShowMessage(true);
    }, 1500);
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    setLoginMethod("google");

    setTimeout(() => {
      setLoading(false);
      setShowMessage(true);
    }, 1200);
  };

  return (
    <div className="flex min-h-[92vh] w-full bg-white dark:bg-black transition-colors duration-300">
      
      {/* Split Layout: Left side (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-zinc-900">
        <img
          src="https://images.unsplash.com/photo-1471341971476-ae15ff5dd4ad?q=80&w=1200&auto=format&fit=crop"
          alt="Vintage camera lens detail"
          className="absolute inset-0 h-full w-full object-cover object-center filter opacity-50 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/10" />
        
        {/* Decorative Overlay Brand */}
        <div className="relative z-10 p-16 flex flex-col justify-between h-full w-full text-white">
          <Link href="/" className="flex items-center space-x-2">
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-xl font-bold tracking-wider text-transparent">
              CAPTURE
            </span>
            <span className="text-xl font-light tracking-widest text-zinc-200">
              SPACE
            </span>
          </Link>
          
          <div className="space-y-4">
            <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
              Access Your Secured Client Spaces.
            </h2>
            <p className="text-base text-zinc-350 font-light leading-relaxed max-w-md">
              Review event proofing folders, catalog favorites, and select digital items with custom permissions.
            </p>
          </div>
          
          <p className="text-xs text-zinc-500 font-light">&copy; 2026 CaptureSpace. Delivered in Elegance.</p>
        </div>
      </div>

      {/* Split Layout: Right side (Form card) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20 bg-white dark:bg-black relative">
        <div className="mx-auto w-full max-w-md flex flex-col">
          
          {/* Header Info */}
          <div className="text-left mb-8">
            <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">Welcome Back</h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 font-light">
              Enter details below to access secure gallery catalogs.
            </p>
          </div>

          {/* Interactive Mock Banner */}
          {showMessage && (
            <div className="mb-6 rounded-2xl bg-indigo-50 border border-indigo-200/80 p-5 dark:bg-indigo-950/20 dark:border-indigo-900 flex items-start gap-3.5 animate-fade-in">
              <svg className="h-5.5 w-5.5 text-indigo-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.085 1.085l-.04.02m-2.137.885l.01-.01m2.137.086l.01-.01m-2.137 1.138l.01-.01m2.137.117l.01-.01M12 2.25V21M3 12h18" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">Phase 0 Static Preview</h4>
                <p className="mt-1.5 text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed font-light">
                  {loginMethod === "email" 
                    ? `Simulated email authentication for user: "${email}".`
                    : "Simulated OAuth handshake with Google Account."
                  } Authentication layers and Firebase listeners are scheduled for implementation in Phase 1.
                </p>
                <button 
                  onClick={() => setShowMessage(false)}
                  suppressHydrationWarning
                  className="mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Dismiss Preview Alert
                </button>
              </div>
            </div>
          )}

          {/* Social Sign-in Card */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            suppressHydrationWarning
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 hover:shadow-sm px-4 py-3.5 text-sm font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading && loginMethod === "google" ? (
              <svg className="animate-spin h-5 w-5 text-zinc-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              // Google Custom Icon SVG
              <svg className="h-5 w-5" viewBox="0 0 24 24" width="24" height="24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.96 5.96 0 018.07 12.55a5.96 5.96 0 015.922-5.96c1.632 0 3.12.602 4.254 1.602l3.203-3.2A10.871 10.871 0 0013.992 1.8 10.15 10.15 0 003.84 11.95a10.15 10.15 0 0010.152 10.15 9.96 9.96 0 009.96-10.457c0-.43-.057-.9-.153-1.358H12.24z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          {/* Divider line */}
          <div className="relative my-6 flex items-center">
            <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800" />
            <span className="mx-4 text-xs font-semibold text-zinc-400 dark:text-zinc-650 uppercase tracking-widest">or</span>
            <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800" />
          </div>

          {/* Credentials Form */}
          <div className="space-y-4">
            {/* Email Field */}
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Email Address</label>
              <input
                id="email"
                name="email"
                type="text"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEmailLogin(e);
                }}
                className={`rounded-xl border bg-transparent px-4 py-3.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 transition-all ${
                  errors.email 
                    ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500" 
                    : "border-zinc-200 focus:border-indigo-500 focus:ring-indigo-500 dark:border-zinc-800 dark:focus:border-indigo-400"
                }`}
                placeholder="you@example.com"
              />
              {errors.email && <span className="text-xs text-rose-500 mt-1 font-medium">{errors.email}</span>}
            </div>

            {/* Password Field */}
            <div className="flex flex-col space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Password</label>
                <a href="#" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Forgot password?</a>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEmailLogin(e);
                }}
                className={`rounded-xl border bg-transparent px-4 py-3.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 transition-all ${
                  errors.password 
                    ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500" 
                    : "border-zinc-200 focus:border-indigo-500 focus:ring-indigo-500 dark:border-zinc-800 dark:focus:border-indigo-400"
                }`}
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
              />
              {errors.password && <span className="text-xs text-rose-500 mt-1 font-medium">{errors.password}</span>}
            </div>

            {/* Form Submit Button */}
            <span
              role="button"
              tabIndex={0}
              onClick={handleEmailLogin}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleEmailLogin(e);
                }
              }}
              className={`w-full mt-4 flex items-center justify-center rounded-xl bg-zinc-950 dark:bg-zinc-50 dark:text-black py-4 text-sm font-bold text-white hover:bg-zinc-850 dark:hover:bg-zinc-200 transition-all select-none cursor-pointer text-center block ${
                loading ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              {loading && loginMethod === "email" ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white dark:text-black" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Authenticating Session...
                </span>
              ) : (
                "Sign In"
              )}
            </span>
          </div>

          {/* Bottom CTA to sign up */}
          <div className="mt-8 text-center">
            <p className="text-sm text-zinc-500 font-light">
              Don&apos;t have an account yet?{" "}
              <Link href="/contact" className="font-bold text-zinc-950 dark:text-zinc-100 hover:underline">
                Request access
              </Link>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
