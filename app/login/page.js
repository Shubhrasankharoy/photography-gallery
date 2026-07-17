"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { user, login, loginWithGoogle, resetPassword } = useAuth();
  const router = useRouter();

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // States for forgot password and mock notifications
  const [isForgotActive, setIsForgotActive] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  
  const [authError, setAuthError] = useState("");

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [user, router]);

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
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleEmailLogin = async (e) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setAuthError("");

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      switch (error.code) {
        case "auth/invalid-credential":
        case "auth/user-not-found":
        case "auth/wrong-password":
          setAuthError("Invalid email or password credentials.");
          break;
        case "auth/too-many-requests":
          setAuthError("Too many failed login attempts. Please try again later.");
          break;
        case "auth/invalid-email":
          setAuthError("The email address is invalid.");
          break;
        default:
          setAuthError("An error occurred during login. Please try again.");
          break;
      }
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setAuthError("");
    try {
      await loginWithGoogle();
      router.push("/dashboard");
    } catch (error) {
      console.error("Google login error:", error);
      if (error.code !== "auth/popup-closed-by-user") {
        setAuthError(error.message || "Google sign in failed. Please try again.");
      }
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    if (e) e.preventDefault();
    setForgotError("");
    setForgotSuccess("");

    if (!forgotEmail.trim()) {
      setForgotError("Email address is required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotEmail)) {
      setForgotError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(forgotEmail);
      setForgotSuccess("Password reset instructions have been sent to your email.");
      setForgotEmail("");
    } catch (error) {
      console.error("Password reset error:", error);
      if (error.code === "auth/user-not-found") {
        setForgotError("No account found with this email address.");
      } else {
        setForgotError(error.message || "Password reset failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
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
          
          <p className="text-xs text-zinc-500 font-light">&copy; {new Date().getFullYear()} CaptureSpace. Delivered in Elegance.</p>
        </div>
      </div>

      {/* Split Layout: Right side (Form card) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20 bg-white dark:bg-black relative">
        <div className="mx-auto w-full max-w-md flex flex-col">
          
          {!isForgotActive ? (
            <>
              {/* Header Info */}
              <div className="text-left mb-8">
                <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">Welcome Back</h1>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 font-light">
                  Enter details below to access secure gallery catalogs.
                </p>
              </div>

              {/* Authentication Error Banner */}
              {authError && (
                <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200/80 p-4 dark:bg-rose-950/20 dark:border-rose-900/50 flex items-start gap-3 animate-fade-in">
                  <svg className="h-5 w-5 text-rose-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-xs font-bold text-rose-800 dark:text-rose-455 uppercase tracking-wider">Login Failed</p>
                    <p className="mt-1 text-xs text-rose-650 dark:text-rose-400 font-light leading-relaxed">
                      {authError}
                    </p>
                  </div>
                </div>
              )}

              {/* Social Sign-in Card */}
              <span
                role="button"
                tabIndex={0}
                onClick={handleGoogleLogin}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleGoogleLogin();
                }}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 hover:shadow-sm px-4 py-3.5 text-sm font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 transition-all cursor-pointer select-none"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" width="24" height="24">
                  <path
                    fill="#EA4335"
                    d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.96 5.96 0 018.07 12.55a5.96 5.96 0 015.922-5.96c1.632 0 3.12.602 4.254 1.602l3.203-3.2A10.871 10.871 0 0013.992 1.8 10.15 10.15 0 003.84 11.95a10.15 10.15 0 0010.152 10.15 9.96 9.96 0 009.96-10.457c0-.43-.057-.9-.153-1.358H12.24z"
                  />
                </svg>
                <span>Continue with Google</span>
              </span>

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
                        ? "border-rose-500 focus:ring-rose-500" 
                        : "border-zinc-200 focus:ring-indigo-500 dark:border-zinc-800 dark:focus:border-indigo-400"
                    }`}
                    placeholder="you@example.com"
                  />
                  {errors.email && <span className="text-xs text-rose-500 mt-1 font-medium">{errors.email}</span>}
                </div>

                {/* Password Field */}
                <div className="flex flex-col space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Password</label>
                    <span 
                      onClick={() => {
                        setIsForgotActive(true);
                        setAuthError("");
                      }}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer select-none"
                    >
                      Forgot password?
                    </span>
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
                        ? "border-rose-500 focus:ring-rose-500" 
                        : "border-zinc-200 focus:ring-indigo-500 dark:border-zinc-800 dark:focus:border-indigo-400"
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
                  {loading ? (
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
                  <Link href="/register" className="font-bold text-zinc-950 dark:text-zinc-100 hover:underline">
                    Create free account
                  </Link>
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Reset Password View */}
              <div className="text-left mb-8">
                <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">Reset Password</h1>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 font-light">
                  Enter your email address and we will send reset instructions.
                </p>
              </div>

              {/* Alerts */}
              {forgotError && (
                <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200/80 p-4 dark:bg-rose-950/20 dark:border-rose-900/50 flex items-start gap-3 animate-fade-in">
                  <svg className="h-5 w-5 text-rose-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-xs text-rose-650 dark:text-rose-455 font-light leading-relaxed">{forgotError}</p>
                </div>
              )}

              {forgotSuccess && (
                <div className="mb-6 rounded-2xl bg-emerald-50 border border-emerald-200/80 p-4 dark:bg-emerald-950/20 dark:border-emerald-900/50 flex items-start gap-3 animate-fade-in">
                  <svg className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.746 3.746 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                  </svg>
                  <p className="text-xs text-emerald-650 dark:text-emerald-455 font-light leading-relaxed">{forgotSuccess}</p>
                </div>
              )}

              {/* Forgot password email input */}
              <div className="space-y-4">
                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="forgotEmail" className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Email Address</label>
                  <input
                    id="forgotEmail"
                    type="text"
                    value={forgotEmail}
                    onChange={(e) => {
                      setForgotEmail(e.target.value);
                      if (forgotError) setForgotError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleForgotPassword(e);
                    }}
                    className="rounded-xl border border-zinc-200 bg-transparent px-4 py-3.5 text-sm text-zinc-900 dark:border-zinc-800 dark:text-zinc-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:focus:border-indigo-400"
                    placeholder="you@example.com"
                  />
                </div>

                <span
                  role="button"
                  tabIndex={0}
                  onClick={handleForgotPassword}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") handleForgotPassword(e);
                  }}
                  className={`w-full mt-4 flex items-center justify-center rounded-xl bg-zinc-950 dark:bg-zinc-50 dark:text-black py-4 text-sm font-bold text-white hover:bg-zinc-850 dark:hover:bg-zinc-200 transition-all select-none cursor-pointer text-center block ${
                    loading ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  {loading ? "Sending link..." : "Send Reset Link"}
                </span>

                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setIsForgotActive(false);
                    setForgotError("");
                    setForgotSuccess("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setIsForgotActive(false);
                  }}
                  className="w-full text-center mt-3 text-sm font-semibold text-zinc-650 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer block select-none"
                >
                  Back to Sign In
                </span>
              </div>
            </>
          )}

        </div>
      </div>

    </div>
  );
}
