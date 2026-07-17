"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = [
    { id: "all", name: "All Work" },
    { id: "wedding", name: "Weddings" },
    { id: "portrait", name: "Portraits" },
    { id: "editorial", name: "Editorial" },
    { id: "nature", name: "Nature & Travel" },
  ];

  const galleries = [
    {
      id: 1,
      title: "Elena & Julian's Wedding",
      category: "wedding",
      location: "Tuscany, Italy",
      image: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop",
      date: "September 2025",
    },
    {
      id: 2,
      title: "Vogue Autumn Editorial",
      category: "editorial",
      location: "Paris, France",
      image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800&auto=format&fit=crop",
      date: "October 2025",
    },
    {
      id: 3,
      title: "Pacific Coastline Chronicles",
      category: "nature",
      location: "Oregon, USA",
      image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop",
      date: "July 2025",
    },
    {
      id: 4,
      title: "Studio Portraits | Maya",
      category: "portrait",
      location: "New York, USA",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop",
      date: "November 2025",
    },
    {
      id: 5,
      title: "Wild Highlands Escape",
      category: "nature",
      location: "Isle of Skye, Scotland",
      image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop",
      date: "June 2025",
    },
    {
      id: 6,
      title: "The Golden Hour Matrimony",
      category: "wedding",
      location: "California, USA",
      image: "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?q=80&w=800&auto=format&fit=crop",
      date: "August 2025",
    },
  ];

  const filteredGalleries = activeCategory === "all" 
    ? galleries 
    : galleries.filter(g => g.category === activeCategory);

  return (
    <div className="flex flex-col w-full min-h-screen bg-white dark:bg-black transition-colors duration-300">
      
      {/* 1. HERO SECTION */}
      <section className="relative flex min-h-[92vh] w-full items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1452780212940-6f5c0d14d84a?q=80&w=1920&auto=format&fit=crop"
            alt="Hero Background"
            className="h-full w-full object-cover object-center filter scale-105 animate-subtle-zoom"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-black/20 dark:from-black dark:via-black/60 dark:to-black/30" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8 flex flex-col items-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/95 backdrop-blur-md border border-white/20 mb-6 tracking-wide animate-fade-in">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping" />
            Empowering Professional Photographers
          </span>
          <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl leading-tight">
            Your Art. Delivered in{" "}
            <span className="bg-linear-to-r from-indigo-300 via-violet-300 to-indigo-300 bg-clip-text text-transparent bg-size-[200%_auto] animate-gradient-flow">
              Pure Elegance
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-zinc-350 dark:text-zinc-300 leading-relaxed font-light">
            Share secure client spaces, facilitate high-speed digital delivery, and enable immediate discovery with cutting-edge AI Face Search.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Link
              href="/login"
              className="flex w-full sm:w-auto items-center justify-center rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-black hover:bg-zinc-200 shadow-xl transition-all hover:scale-105 duration-200"
            >
              Get Started Free
            </Link>
            <a
              href="#showcase"
              className="flex w-full sm:w-auto items-center justify-center rounded-full border border-white/30 bg-white/5 backdrop-blur-md px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/15 transition-all hover:scale-105 duration-200"
            >
              Explore Sample Galleries
            </a>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 animate-bounce">
          <a href="#features" className="text-white/60 hover:text-white transition-colors" aria-label="Scroll down">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </a>
        </div>
      </section>

      {/* 2. FEATURES GRID SECTION */}
      <section id="features" className="py-24 bg-zinc-50 dark:bg-zinc-950/30 transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-base font-semibold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase">Core Ecosystem</h2>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
              Engineered for Creative Scale
            </p>
            <p className="mt-4 text-lg text-zinc-650 dark:text-zinc-400 font-light leading-relaxed">
              We cover the logistics so you can remain dedicated to your lens.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="group relative rounded-2xl border border-zinc-200/60 bg-white p-6 shadow-sm hover:shadow-xl hover:border-indigo-500/10 dark:border-zinc-800/60 dark:bg-black transition-all duration-300">
              <div className="inline-flex rounded-lg bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-zinc-100">AI Face Search</h3>
              <p className="mt-2 text-sm text-zinc-650 dark:text-zinc-400 leading-relaxed font-light">
                Invite event guests to snap a selfie and locate their matching photographs inside your gallery instantly.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group relative rounded-2xl border border-zinc-200/60 bg-white p-6 shadow-sm hover:shadow-xl hover:border-indigo-500/10 dark:border-zinc-800/60 dark:bg-black transition-all duration-300">
              <div className="inline-flex rounded-lg bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.746 3.746 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-zinc-100">Secure Client Proofing</h3>
              <p className="mt-2 text-sm text-zinc-650 dark:text-zinc-400 leading-relaxed font-light">
                Implement PIN locks, download limits, watermarks, and selective digital rights per user or client space.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group relative rounded-2xl border border-zinc-200/60 bg-white p-6 shadow-sm hover:shadow-xl hover:border-indigo-500/10 dark:border-zinc-800/60 dark:bg-black transition-all duration-300">
              <div className="inline-flex rounded-lg bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-zinc-100">Google Drive Sync</h3>
              <p className="mt-2 text-sm text-zinc-650 dark:text-zinc-400 leading-relaxed font-light">
                Sync finished client galleries to your Google Drive automatically to leverage affordable cloud space.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group relative rounded-2xl border border-zinc-200/60 bg-white p-6 shadow-sm hover:shadow-xl hover:border-indigo-500/10 dark:border-zinc-800/60 dark:bg-black transition-all duration-300">
              <div className="inline-flex rounded-lg bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-zinc-100">Intelligent Metrics</h3>
              <p className="mt-2 text-sm text-zinc-650 dark:text-zinc-400 leading-relaxed font-light">
                Track downloads, image favorites, and viewing times. Identify what catches the client&apos;s eye most.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SHOWCASE / CLIENT GALLERY DEMO */}
      <section id="showcase" className="py-24 bg-white dark:bg-black transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="text-base font-semibold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase">Live Proof</h2>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
                Explore Client Collections
              </p>
            </div>
            {/* Filters */}
            <div className="flex flex-wrap gap-2 pt-2 md:pt-0">
              {categories.map(c => (
                <span
                  key={c.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveCategory(c.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setActiveCategory(c.id);
                    }
                  }}
                  className={`rounded-full px-4 py-2 text-xs font-semibold tracking-wider transition-all duration-200 cursor-pointer select-none ${
                    activeCategory === c.id 
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-black" 
                      : "bg-zinc-100 text-zinc-650 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
                >
                  {c.name}
                </span>
              ))}
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredGalleries.map((gallery) => (
              <div 
                key={gallery.id} 
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Image Wrap */}
                <div className="relative aspect-4/3 w-full overflow-hidden bg-zinc-200 dark:bg-zinc-900">
                  <img
                    src={gallery.image}
                    alt={gallery.title}
                    className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Category Badge overlay */}
                  <span className="absolute top-4 left-4 rounded-full bg-white/80 backdrop-blur-md px-3 py-1 text-[10px] font-bold tracking-widest text-zinc-900 uppercase dark:bg-black/80 dark:text-zinc-100">
                    {gallery.category}
                  </span>
                </div>
                {/* Bottom detail text */}
                <div className="p-5 flex flex-col flex-1 justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 tracking-wider">
                      {gallery.location}
                    </span>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mt-1 line-clamp-1">
                      {gallery.title}
                    </h3>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-zinc-150 pt-4 dark:border-zinc-900 text-xs text-zinc-500">
                    <span>{gallery.date}</span>
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-1 font-semibold text-zinc-800 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      View Space
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. PREMIUM PRICING TEASER CARD SECTION */}
      <section className="py-24 bg-zinc-50 dark:bg-zinc-950/30 transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-base font-semibold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase">Pricing Tier</h2>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
              Flexible Tiers for Every Stage
            </p>
          </div>

          <div className="mx-auto max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Tier 1 */}
            <div className="rounded-3xl border border-zinc-200/80 bg-white p-8 dark:border-zinc-800/80 dark:bg-black flex flex-col justify-between transition-all hover:shadow-lg">
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Studio Starter</h3>
                <p className="mt-2 text-sm text-zinc-500 leading-relaxed font-light">Ideal for emerging creators delivering primary events.</p>
                <div className="mt-6 flex items-baseline">
                  <span className="text-4xl font-extrabold text-zinc-950 dark:text-zinc-50">$0</span>
                  <span className="ml-1 text-sm font-semibold text-zinc-500">/ forever</span>
                </div>
                <ul className="mt-8 space-y-4 text-sm text-zinc-660 dark:text-zinc-400 font-light">
                  <li className="flex items-center gap-3">
                    <svg className="h-4.5 w-4.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span>3 Active Galleries</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <svg className="h-4.5 w-4.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span>Basic Proofing Controls</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <svg className="h-4.5 w-4.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span>5 GB File Storage</span>
                  </li>
                </ul>
              </div>
              <Link 
                href="/login"
                className="mt-8 flex items-center justify-center rounded-full border border-zinc-350 dark:border-zinc-800 bg-transparent py-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-950 transition-all"
              >
                Sign Up Free
              </Link>
            </div>

            {/* Tier 2 (Featured) */}
            <div className="relative rounded-3xl border-2 border-indigo-600 bg-white p-8 dark:bg-black flex flex-col justify-between shadow-xl shadow-indigo-500/5 dark:shadow-indigo-500/10">
              <span className="absolute top-0 right-8 -translate-y-1/2 rounded-full bg-linear-to-r from-violet-600 to-indigo-600 px-4 py-1 text-xs font-bold text-white tracking-widest uppercase">
                POPULAR
              </span>
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Creative Pro</h3>
                <p className="mt-2 text-sm text-zinc-500 leading-relaxed font-light">Unlimited access for active, full-time professionals.</p>
                <div className="mt-6 flex items-baseline">
                  <span className="text-4xl font-extrabold text-zinc-950 dark:text-zinc-50">$29</span>
                  <span className="ml-1 text-sm font-semibold text-zinc-500">/ month</span>
                </div>
                <ul className="mt-8 space-y-4 text-sm text-zinc-660 dark:text-zinc-400 font-light">
                  <li className="flex items-center gap-3">
                    <svg className="h-4.5 w-4.5 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span>Unlimited Active Galleries</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <svg className="h-4.5 w-4.5 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span>AI Face Search Enabled</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <svg className="h-4.5 w-4.5 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span>Google Drive Auto-Sync</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <svg className="h-4.5 w-4.5 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span>Custom Domain Branding</span>
                  </li>
                </ul>
              </div>
              <Link 
                href="/login"
                className="mt-8 flex items-center justify-center rounded-full bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200"
              >
                Go Pro Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HERO CALL TO ACTION */}
      <section className="relative py-24 bg-white dark:bg-black transition-colors duration-300">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-zinc-950 px-8 py-16 text-center shadow-2xl dark:bg-zinc-900 flex flex-col items-center">
            {/* Visual background rings */}
            <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
            
            <h2 className="relative z-10 text-3xl font-extrabold text-white sm:text-4xl">Ready to Elevate Your Client Experience?</h2>
            <p className="relative z-10 mt-4 max-w-lg text-sm text-zinc-400 font-light leading-relaxed">
              Create a free account in seconds. Share, secure, and deliver stunning image catalogs.
            </p>
            <div className="relative z-10 mt-8 flex flex-col sm:flex-row items-center gap-4">
              <Link
                href="/login"
                className="rounded-full bg-white px-8 py-3 text-sm font-bold text-black hover:bg-zinc-200 shadow-md transition-all"
              >
                Get Started For Free
              </Link>
              <Link
                href="/contact"
                className="rounded-full border border-white/20 bg-white/5 backdrop-blur-md px-8 py-3 text-sm font-bold text-white hover:bg-white/10 transition-all"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
