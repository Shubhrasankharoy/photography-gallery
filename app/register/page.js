"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Register() {
  const { user, register, loginWithGoogle } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear errors as user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (authError) setAuthError("");
  };

  const validate = () => {
    const tempErrors = {};
    if (!formData.name.trim()) {
      tempErrors.name = "Full name is required.";
    }

    if (!formData.email.trim()) {
      tempErrors.email = "Email address is required.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        tempErrors.email = "Please enter a valid email address.";
      }
    }

    if (!formData.password) {
      tempErrors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      tempErrors.password = "Password must be at least 6 characters.";
    }

    if (!formData.confirmPassword) {
      tempErrors.confirmPassword = "Please confirm your password.";
    } else if (formData.password !== formData.confirmPassword) {
      tempErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setAuthError("");

    try {
      await register(formData.email, formData.password, formData.name);
      router.push("/dashboard");
    } catch (error) {
      console.error("Registration error:", error);
      // Map Firebase errors to user-friendly messages
      switch (error.code) {
        case "auth/email-already-in-use":
          setAuthError("This email address is already registered.");
          break;
        case "auth/invalid-email":
          setAuthError("The email address is invalid.");
          break;
        case "auth/weak-password":
          setAuthError("The password is too weak. Please use at least 6 characters.");
          break;
        default:
          setAuthError(error.message || "An error occurred during registration. Please try again.");
          break;
      }
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setAuthError("");
    try {
      await loginWithGoogle();
      router.push("/dashboard");
    } catch (error) {
      console.error("Google sign up error:", error);
      if (error.code !== "auth/popup-closed-by-user") {
        setAuthError(error.message || "Google sign in failed. Please try again.");
      }
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
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/30 to-black/10" />
        
        {/* Decorative Overlay Brand */}
        <div className="relative z-10 p-16 flex flex-col justify-between h-full w-full text-white">
          <Link href="/" className="flex items-center space-x-2">
            <span className="bg-linear-to-r from-violet-400 to-indigo-400 bg-clip-text text-xl font-bold tracking-wider text-transparent">
              CAPTURE
            </span>
            <span className="text-xl font-light tracking-widest text-zinc-200">
              SPACE
            </span>
          </Link>
          
          <div className="space-y-4">
            <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
              Create Your Creative Workspace.
            </h2>
            <p className="text-base text-zinc-350 font-light leading-relaxed max-w-md">
              Start delivering beautiful image catalogs, setting secure client permissions, and locating faces instantly.
            </p>
          </div>
          
          <p className="text-xs text-zinc-500 font-light">&copy; {new Date().getFullYear()} CaptureSpace. Delivered in Elegance.</p>
        </div>
      </div>

      {/* Split Layout: Right side (Form card) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20 bg-white dark:bg-black relative">
        <div className="mx-auto w-full max-w-md flex flex-col">
          
          {/* Header Info */}
          <div className="text-left mb-8">
            <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">Create Account</h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 font-light">
              Get started with free client proofing spaces today.
            </p>
          </div>

          {/* Registration Error Banner */}
          {authError && (
            <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200/80 p-4 dark:bg-rose-950/20 dark:border-rose-900/50 flex items-start gap-3 animate-fade-in">
              <svg className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-xs font-bold text-rose-800 dark:text-rose-450 uppercase tracking-wider">Registration Failed</p>
                <p className="mt-1 text-xs text-rose-650 dark:text-rose-400 font-light leading-relaxed">
                  {authError}
                </p>
              </div>
            </div>
          )}

          {/* Social Sign-up */}
          <span
            role="button"
            tabIndex={0}
            onClick={handleGoogleSignup}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleGoogleSignup();
            }}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 hover:shadow-sm px-4 py-3.5 text-sm font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 transition-all cursor-pointer select-none"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" width="24" height="24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.96 5.96 0 018.07 12.55a5.96 5.96 0 015.922-5.96c1.632 0 3.12.602 4.254 1.602l3.203-3.2A10.871 10.871 0 0013.992 1.8 10.15 10.15 0 003.84 11.95a10.15 10.15 0 0010.152 10.15 9.96 9.96 0 009.96-10.457c0-.43-.057-.9-.153-1.358H12.24z"
              />
            </svg>
            <span>Sign Up with Google</span>
          </span>

          {/* Divider line */}
          <div className="relative my-6 flex items-center">
            <div className="grow border-t border-zinc-200 dark:border-zinc-800" />
            <span className="mx-4 text-xs font-semibold text-zinc-400 dark:text-zinc-650 uppercase tracking-widest">or</span>
            <div className="grow border-t border-zinc-200 dark:border-zinc-800" />
          </div>

          {/* Credentials Form */}
          <div className="space-y-4">
            {/* Name Field */}
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-450">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRegister(e);
                }}
                className={`rounded-xl border bg-transparent px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 transition-all ${
                  errors.name 
                    ? "border-rose-500 focus:ring-rose-500" 
                    : "border-zinc-200 focus:ring-indigo-500 dark:border-zinc-800 dark:focus:border-indigo-400"
                }`}
                placeholder="John Doe"
              />
              {errors.name && <span className="text-xs text-rose-500 mt-1 font-medium">{errors.name}</span>}
            </div>

            {/* Email Field */}
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-450">Email Address</label>
              <input
                id="email"
                name="email"
                type="text"
                value={formData.email}
                onChange={handleChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRegister(e);
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

            {/* Password Fields Group */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Password */}
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-455">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRegister(e);
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

              {/* Confirm Password */}
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-455">Confirm Password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRegister(e);
                  }}
                  className={`rounded-xl border bg-transparent px-4 py-3.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 transition-all ${
                    errors.confirmPassword 
                      ? "border-rose-500 focus:ring-rose-500" 
                      : "border-zinc-200 focus:ring-indigo-500 dark:border-zinc-800 dark:focus:border-indigo-400"
                  }`}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                />
                {errors.confirmPassword && <span className="text-xs text-rose-500 mt-1 font-medium">{errors.confirmPassword}</span>}
              </div>
            </div>

            {/* Form Submit Button */}
            <span
              role="button"
              tabIndex={0}
              onClick={handleRegister}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleRegister(e);
                }
              }}
              className={`w-full mt-6 flex items-center justify-center rounded-xl bg-zinc-950 dark:bg-zinc-50 dark:text-black py-4 text-sm font-bold text-white hover:bg-zinc-850 dark:hover:bg-zinc-200 transition-all select-none cursor-pointer text-center ${
                loading ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white dark:text-black" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating Workspace...
                </span>
              ) : (
                "Create Account"
              )}
            </span>
          </div>

          {/* Bottom CTA to log in */}
          <div className="mt-8 text-center">
            <p className="text-sm text-zinc-500 font-light">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-zinc-950 dark:text-zinc-100 hover:underline">
                Sign In
              </Link>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
