"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";

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

export default function About() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const values = [
    {
      title: "Artistic Integrity",
      description: "We design every pixel of our galleries to respect and highlight your visual style without distraction.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l8.904-4.813L21 6.187 17.813 3z" />
        </svg>
      ),
    },
    {
      title: "Security & Control",
      description: "Protect client assets with robust pin configurations, print restrictions, and direct watermarking.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.599-3.75A11.959 11.959 0 0112 5.714z" />
        </svg>
      ),
    },
    {
      title: "Speed of Light",
      description: "High-speed media optimization and globally distributed CDN deliveries keep load times instant.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      ),
    },
    {
      title: "Future-Facing AI",
      description: "Leverage embedded AI tools like immediate Face Search to revolutionize client navigation.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l8.904-4.813L21 6.187 17.813 3z" />
        </svg>
      ),
    },
  ];

  const faqs = [
    {
      question: "How does the AI Face Search work?",
      answer: "When guests visit a gallery, they can upload a quick selfie. CaptureSpace uses local browser-safe neural network embeddings to compare face points and sort out matching images in under two seconds. This happens privately and securely.",
    },
    {
      question: "Can I connect my own Google Drive for storage?",
      answer: "Yes! CaptureSpace integrates natively with Google Drive. You can map folders directly, allowing high-resolution assets to sync safely and cheaply to your Google storage while maintaining web galleries inside CaptureSpace.",
    },
    {
      question: "What formats and file sizes are supported?",
      answer: "We support high-resolution JPEG, PNG, and WebP uploads. In our Pro tier, you can upload raw files and deliver full-resolution print files alongside optimized web versions for proofing.",
    },
    {
      question: "How do client download limits work?",
      answer: "Within the event dashboard, you can restrict digital downloads to specific email addresses, set download limits (e.g. 5 free high-res photos, then paid), or issue secure download PIN codes to prevent unauthorized access.",
    },
  ];

  const stats = [
    { value: "10M+", label: "Photos Hosted" },
    { value: "20k+", label: "Creative Users" },
    { value: "99.9%", label: "Uptime SLA" },
  ];

  return (
    <div className="w-full min-h-screen bg-white dark:bg-[#181818] transition-colors duration-300">
      
      {/* Editorial Header */}
      <section className="relative py-20 lg:py-28 overflow-hidden bg-[#F7F7F7] dark:bg-[#202020]">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center"
        >
          <motion.span variants={fadeUp} className="text-xs font-bold tracking-widest text-[#D4AF37] uppercase">
            Our Purpose
          </motion.span>
          <motion.h1
            variants={fadeUp}
            className="mt-4 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl lg:text-6xl max-w-3xl leading-tight font-headline"
          >
            Redefining How the World Experiences Photography
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-6 max-w-2xl text-lg text-[#8E8E8E] font-light leading-relaxed">
            CaptureSpace was born out of a simple problem: photographers make beautiful art, but client delivery pipelines were cluttered, slow, and outdated. We build sleek, intuitive digital galleries designed for visual perfection.
          </motion.p>
        </motion.div>
      </section>

      {/* Narrative Section */}
      <section className="py-20 bg-white dark:bg-[#181818]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Story Image */}
            <motion.div
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative overflow-hidden rounded-[20px] aspect-4/3 bg-zinc-100 dark:bg-[#262626] shadow-[var(--shadow-lg)]"
            >
              <img
                src="https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=1200&auto=format&fit=crop"
                alt="Photographer checking camera settings"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            </motion.div>

            {/* Narrative text */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={staggerContainer}
              className="flex flex-col space-y-6"
            >
              <motion.h2 variants={fadeUp} className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-headline">
                Created by Photographers, for Photographers
              </motion.h2>
              <motion.p variants={fadeUp} className="text-base text-[#8E8E8E] font-light leading-relaxed">
                We believe that the delivery of your work should be just as professional and premium as the shoot itself. A client&apos;s first impression of their digital gallery dictates their overall appreciation of the service.
              </motion.p>
              <motion.p variants={fadeUp} className="text-base text-[#8E8E8E] font-light leading-relaxed">
                By combining modern web technologies (glassmorphism layouts, hardware-accelerated gallery grids) with intelligent search algorithms, we enable creators to manage entire event delivery pipelines in one central place.
              </motion.p>
              
              <motion.div variants={fadeUp} className="pt-4 flex items-center gap-6">
                {stats.map((stat, i) => (
                  <div key={stat.label} className="flex items-center gap-6">
                    {i > 0 && <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800" />}
                    <div>
                      <h4 className="text-3xl font-extrabold text-[#D4AF37]">{stat.value}</h4>
                      <p className="text-xs text-[#8E8E8E] font-medium uppercase mt-1">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-[#F7F7F7] dark:bg-[#202020] transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="mx-auto max-w-3xl text-center mb-16"
          >
            <motion.h2 variants={fadeUp} className="text-sm font-semibold tracking-wider text-[#D4AF37] uppercase">
              Core Ethos
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl font-headline">
              Principles We Stand By
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {values.map((v, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                whileHover={{ y: -4, transition: { duration: 0.15 } }}
                className="rounded-[20px] border border-zinc-200/50 bg-white p-6 shadow-[var(--shadow-soft)] dark:border-zinc-800/40 dark:bg-[#262626] transition-all hover:shadow-[var(--shadow-lg)]"
              >
                <div className="rounded-[12px] bg-[#D4AF37]/10 p-2.5 text-[#D4AF37] inline-block">
                  {v.icon}
                </div>
                <h3 className="mt-4 text-base font-bold text-zinc-900 dark:text-zinc-50">{v.title}</h3>
                <p className="mt-2 text-sm text-[#8E8E8E] leading-relaxed font-light">{v.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="py-20 bg-white dark:bg-[#181818]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUp} className="text-sm font-semibold tracking-wider text-[#D4AF37] uppercase">
              Need Answers?
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl font-headline">
              Frequently Asked Questions
            </motion.p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.06, duration: 0.4 }}
                  className="rounded-[20px] border border-zinc-200 bg-[#FAFAFA] dark:border-zinc-800/40 dark:bg-[#202020] overflow-hidden transition-all"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="flex w-full items-center justify-between px-6 py-5 text-left text-zinc-800 dark:text-zinc-200 focus:outline-none"
                  >
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{faq.question}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.25 }}
                      className="ml-4 shrink-0 text-[#8E8E8E] hover:text-[#D4AF37]"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden border-t border-zinc-200 dark:border-zinc-800/40"
                      >
                        <div className="px-6 py-5 text-sm text-[#8E8E8E] leading-relaxed font-light">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About CTA */}
      <section className="py-16 bg-[#F7F7F7] dark:bg-[#202020] transition-colors duration-300">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8"
        >
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl font-headline">Want to know more about integration limits?</h2>
          <p className="mt-3 text-sm text-[#8E8E8E] font-light max-w-md mx-auto">
            Drop us a message, and our developer team will explain custom storage setup details.
          </p>
          <div className="mt-8 flex justify-center">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/contact"
                className="rounded-[12px] bg-[#D4AF37] hover:bg-[#E0C55B] px-8 py-3 text-sm font-semibold text-[#181818] transition-all shadow-md"
              >
                Contact Support
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
