"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";

/* ── Motion Variants ──────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

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

  const features = [
    {
      title: "AI Face Search",
      description: "Invite event guests to snap a selfie and locate their matching photographs inside your gallery instantly.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
        </svg>
      ),
    },
    {
      title: "Secure Client Proofing",
      description: "Implement PIN locks, download limits, watermarks, and selective digital rights per user or client space.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.746 3.746 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
        </svg>
      ),
    },
    {
      title: "Google Drive Sync",
      description: "Sync finished client galleries to your Google Drive automatically to leverage affordable cloud space.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: "Intelligent Metrics",
      description: "Track downloads, image favorites, and viewing times. Identify what catches the client\u0027s eye most.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-col w-full min-h-screen bg-white dark:bg-[#181818] transition-colors duration-300">
      
      {/* ═══════════════════════════════════════════════════════════
          1. HERO SECTION
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative flex min-h-[92vh] w-full items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1452780212940-6f5c0d14d84a?q=80&w=1920&auto=format&fit=crop"
            alt="Hero Background"
            className="h-full w-full object-cover object-center scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
        </div>

        {/* Content Container */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8 flex flex-col items-center"
        >
          <motion.span
            variants={fadeUp}
            custom={0}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-white/95 backdrop-blur-md border border-white/15 mb-8 tracking-wide"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
            Empowering Professional Photographers
          </motion.span>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl leading-tight"
          >
            <span className="font-body">Your Art. Delivered in</span>{" "}
            <span className="font-headline text-[#D4AF37]">
              Pure Elegance
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="mt-6 max-w-2xl text-lg text-zinc-300 leading-relaxed font-light"
          >
            Share secure client spaces, facilitate high-speed digital delivery, and enable immediate discovery with cutting-edge AI Face Search.
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={3}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/login"
                className="flex w-full sm:w-auto items-center justify-center rounded-[12px] bg-[#D4AF37] px-8 py-3.5 text-sm font-semibold text-[#181818] hover:bg-[#E0C55B] shadow-xl transition-all duration-150"
              >
                Get Started Free
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <a
                href="#showcase"
                className="flex w-full sm:w-auto items-center justify-center rounded-[12px] border border-white/25 bg-white/5 backdrop-blur-md px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/15 transition-all duration-150"
              >
                Explore Sample Galleries
              </a>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
        >
          <a href="#features" className="text-white/50 hover:text-[#D4AF37] transition-colors" aria-label="Scroll down">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </a>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          2. FEATURES GRID SECTION
          ═══════════════════════════════════════════════════════════ */}
      <section id="features" className="py-24 bg-[#F7F7F7] dark:bg-[#202020] transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="mx-auto max-w-3xl text-center"
          >
            <motion.h2 variants={fadeUp} className="text-sm font-semibold tracking-wider text-[#D4AF37] uppercase">
              Core Ecosystem
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl font-headline">
              Engineered for Creative Scale
            </motion.p>
            <motion.p variants={fadeUp} className="mt-4 text-lg text-[#8E8E8E] font-light leading-relaxed">
              We cover the logistics so you can remain dedicated to your lens.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={staggerContainer}
            className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                custom={i}
                whileHover={{ y: -4, transition: { duration: 0.15 } }}
                className="group relative rounded-[20px] border border-zinc-200/60 bg-white p-6 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lg)] dark:border-zinc-800/40 dark:bg-[#262626] transition-all duration-300"
              >
                <div className="inline-flex rounded-[12px] bg-[#D4AF37]/10 p-3 text-[#D4AF37] group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-zinc-100">{feature.title}</h3>
                <p className="mt-2 text-sm text-[#8E8E8E] leading-relaxed font-light">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          3. SHOWCASE / CLIENT GALLERY DEMO
          ═══════════════════════════════════════════════════════════ */}
      <section id="showcase" className="py-24 bg-white dark:bg-[#181818] transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
          >
            <div>
              <motion.h2 variants={fadeUp} className="text-sm font-semibold tracking-wider text-[#D4AF37] uppercase">
                Live Proof
              </motion.h2>
              <motion.p variants={fadeUp} className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl font-headline">
                Explore Client Collections
              </motion.p>
            </div>
            {/* Filters */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-2 pt-2 md:pt-0">
              {categories.map(c => (
                <motion.span
                  key={c.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveCategory(c.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setActiveCategory(c.id);
                    }
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`rounded-full px-4 py-2 text-xs font-semibold tracking-wider transition-all duration-200 cursor-pointer select-none ${
                    activeCategory === c.id 
                      ? "bg-[#D4AF37] text-[#181818]" 
                      : "bg-zinc-100 text-[#8E8E8E] hover:bg-zinc-200 dark:bg-[#262626] dark:hover:bg-[#2D2D2D]"
                  }`}
                >
                  {c.name}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>

          {/* Grid Layout */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredGalleries.map((gallery, i) => (
              <motion.div
                key={gallery.id}
                variants={fadeUp}
                custom={i}
                whileHover={{ y: -6, transition: { duration: 0.15 } }}
                className="group relative flex flex-col overflow-hidden rounded-[20px] border border-zinc-100 dark:border-zinc-800/40 bg-[#FAFAFA] dark:bg-[#202020] transition-all duration-300 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lg)]"
              >
                {/* Image Wrap */}
                <div className="relative aspect-4/3 w-full overflow-hidden bg-zinc-200 dark:bg-zinc-900">
                  <motion.img
                    src={gallery.image}
                    alt={gallery.title}
                    className="h-full w-full object-cover object-center"
                    loading="lazy"
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                  {/* Category Badge overlay */}
                  <span className="absolute top-4 left-4 rounded-full bg-white/80 backdrop-blur-md px-3 py-1 text-[10px] font-bold tracking-widest text-zinc-900 uppercase dark:bg-black/70 dark:text-zinc-100">
                    {gallery.category}
                  </span>
                </div>
                {/* Bottom detail text */}
                <div className="p-5 flex flex-col flex-1 justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-[#D4AF37] tracking-wider">
                      {gallery.location}
                    </span>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mt-1 line-clamp-1">
                      {gallery.title}
                    </h3>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800 text-xs text-[#8E8E8E]">
                    <span>{gallery.date}</span>
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-1 font-semibold text-zinc-800 dark:text-zinc-200 hover:text-[#D4AF37] transition-colors"
                    >
                      View Space
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          4. PREMIUM PRICING TEASER CARD SECTION
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-[#F7F7F7] dark:bg-[#202020] transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="mx-auto max-w-3xl text-center mb-16"
          >
            <motion.h2 variants={fadeUp} className="text-sm font-semibold tracking-wider text-[#D4AF37] uppercase">
              Pricing Tier
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl font-headline">
              Flexible Tiers for Every Stage
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={staggerContainer}
            className="mx-auto max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {/* Tier 1 */}
            <motion.div
              variants={fadeUp}
              whileHover={{ y: -4, transition: { duration: 0.15 } }}
              className="rounded-[24px] border border-zinc-200/80 bg-white p-8 dark:border-zinc-800/60 dark:bg-[#262626] flex flex-col justify-between transition-all shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lg)]"
            >
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Studio Starter</h3>
                <p className="mt-2 text-sm text-[#8E8E8E] leading-relaxed font-light">Ideal for emerging creators delivering primary events.</p>
                <div className="mt-6 flex items-baseline">
                  <span className="text-4xl font-extrabold text-zinc-950 dark:text-zinc-50">$0</span>
                  <span className="ml-1 text-sm font-semibold text-[#8E8E8E]">/ forever</span>
                </div>
                <ul className="mt-8 space-y-4 text-sm text-[#8E8E8E] font-light">
                  {["3 Active Galleries", "Basic Proofing Controls", "5 GB File Storage"].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <svg className="h-4.5 w-4.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link 
                  href="/login"
                  className="mt-8 flex items-center justify-center rounded-[12px] border border-zinc-300 dark:border-zinc-700 bg-transparent py-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-[#2D2D2D] transition-all"
                >
                  Sign Up Free
                </Link>
              </motion.div>
            </motion.div>

            {/* Tier 2 (Featured) */}
            <motion.div
              variants={fadeUp}
              whileHover={{ y: -4, transition: { duration: 0.15 } }}
              className="relative rounded-[24px] border-2 border-[#D4AF37] bg-white p-8 dark:bg-[#262626] flex flex-col justify-between shadow-xl shadow-[#D4AF37]/5 dark:shadow-[#D4AF37]/10"
            >
              <span className="absolute top-0 right-8 -translate-y-1/2 rounded-full bg-[#D4AF37] px-4 py-1 text-xs font-bold text-[#181818] tracking-widest uppercase">
                POPULAR
              </span>
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Creative Pro</h3>
                <p className="mt-2 text-sm text-[#8E8E8E] leading-relaxed font-light">Unlimited access for active, full-time professionals.</p>
                <div className="mt-6 flex items-baseline">
                  <span className="text-4xl font-extrabold text-zinc-950 dark:text-zinc-50">$29</span>
                  <span className="ml-1 text-sm font-semibold text-[#8E8E8E]">/ month</span>
                </div>
                <ul className="mt-8 space-y-4 text-sm text-[#8E8E8E] font-light">
                  {["Unlimited Active Galleries", "AI Face Search Enabled", "Google Drive Auto-Sync", "Custom Domain Branding"].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <svg className="h-4.5 w-4.5 text-[#D4AF37] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link 
                  href="/login"
                  className="mt-8 flex items-center justify-center rounded-[12px] bg-[#D4AF37] hover:bg-[#E0C55B] py-3 text-sm font-semibold text-[#181818] shadow-md transition-all duration-150"
                >
                  Go Pro Now
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          5. HERO CALL TO ACTION
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative py-24 bg-white dark:bg-[#181818] transition-colors duration-300">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative overflow-hidden rounded-[24px] bg-[#2F2F2F] px-8 py-16 text-center shadow-2xl flex flex-col items-center"
          >
            {/* Visual background accents */}
            <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-[#D4AF37]/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-[#D4AF37]/5 blur-3xl pointer-events-none" />
            
            <h2 className="relative z-10 text-3xl font-bold text-white sm:text-4xl font-headline">Ready to Elevate Your Client Experience?</h2>
            <p className="relative z-10 mt-4 max-w-lg text-sm text-zinc-400 font-light leading-relaxed">
              Create a free account in seconds. Share, secure, and deliver stunning image catalogs.
            </p>
            <div className="relative z-10 mt-8 flex flex-col sm:flex-row items-center gap-4">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/login"
                  className="rounded-[12px] bg-[#D4AF37] px-8 py-3 text-sm font-bold text-[#181818] hover:bg-[#E0C55B] shadow-md transition-all"
                >
                  Get Started For Free
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/contact"
                  className="rounded-[12px] border border-white/20 bg-white/5 backdrop-blur-md px-8 py-3 text-sm font-bold text-white hover:bg-white/10 transition-all"
                >
                  Contact Sales
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
