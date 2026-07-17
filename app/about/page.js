"use client";

import { useState } from "react";
import Link from "next/link";

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
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l8.904-4.813L21 6.187 17.813 3z" />
        </svg>
      ),
    },
    {
      title: "Security & Control",
      description: "Protect client assets with robust pin configurations, print restrictions, and direct watermarking.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.599-3.75A11.959 11.959 0 0112 5.714z" />
        </svg>
      ),
    },
    {
      title: "Speed of Light",
      description: "High-speed media optimization and globally distributed CDN deliveries keep load times instant.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      ),
    },
    {
      title: "Future-Facing AI",
      description: "Leverage embedded AI tools like immediate Face Search to revolutionize client navigation.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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

  return (
    <div className="w-full min-h-screen bg-white dark:bg-black transition-colors duration-300">
      
      {/* Editorial Header */}
      <section className="relative py-20 lg:py-28 overflow-hidden bg-zinc-50 dark:bg-zinc-950/20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          <span className="text-xs font-bold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">
            Our Purpose
          </span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl lg:text-6xl max-w-3xl leading-tight">
            Redefining How the World Experiences Photography
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-zinc-655 dark:text-zinc-400 font-light leading-relaxed">
            CaptureSpace was born out of a simple problem: photographers make beautiful art, but client delivery pipelines were cluttered, slow, and outdated. We build sleek, intuitive digital galleries designed for visual perfection.
          </p>
        </div>
      </section>

      {/* Narrative Section */}
      <section className="py-20 bg-white dark:bg-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Story Image */}
            <div className="relative overflow-hidden rounded-3xl aspect-[4/3] bg-zinc-150 dark:bg-zinc-900 shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=1200&auto=format&fit=crop"
                alt="Photographer checking camera settings"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            </div>

            {/* Narrative text */}
            <div className="flex flex-col space-y-6">
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Created by Photographers, for Photographers
              </h2>
              <p className="text-base text-zinc-650 dark:text-zinc-400 font-light leading-relaxed">
                We believe that the delivery of your work should be just as professional and premium as the shoot itself. A client&apos;s first impression of their digital gallery dictates their overall appreciation of the service.
              </p>
              <p className="text-base text-zinc-650 dark:text-zinc-400 font-light leading-relaxed">
                By combining modern web technologies (glassmorphism layouts, hardware-accelerated gallery grids) with intelligent search algorithms, we enable creators to manage entire event delivery pipelines in one central place.
              </p>
              
              <div className="pt-4 flex items-center gap-6">
                <div>
                  <h4 className="text-3xl font-extrabold text-indigo-650 dark:text-indigo-400">10M+</h4>
                  <p className="text-xs text-zinc-500 font-medium uppercase mt-1">Photos Hosted</p>
                </div>
                <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800" />
                <div>
                  <h4 className="text-3xl font-extrabold text-indigo-655 dark:text-indigo-400">20k+</h4>
                  <p className="text-xs text-zinc-500 font-medium uppercase mt-1">Creative Users</p>
                </div>
                <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800" />
                <div>
                  <h4 className="text-3xl font-extrabold text-indigo-660 dark:text-indigo-400">99.9%</h4>
                  <p className="text-xs text-zinc-500 font-medium uppercase mt-1">Uptime SLA</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-zinc-50 dark:bg-zinc-950/20 transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-base font-semibold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase">Core Ethos</h2>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
              Principles We Stand By
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((v, i) => (
              <div key={i} className="rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm dark:border-zinc-850 dark:bg-black transition-all hover:shadow-md">
                <div className="rounded-lg bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 inline-block">
                  {v.icon}
                </div>
                <h3 className="mt-4 text-base font-bold text-zinc-900 dark:text-zinc-50">{v.title}</h3>
                <p className="mt-2 text-sm text-zinc-650 dark:text-zinc-400 leading-relaxed font-light">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="py-20 bg-white dark:bg-black">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-base font-semibold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase">Need Answers?</h2>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
              Frequently Asked Questions
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50/50 dark:border-zinc-850 dark:bg-zinc-950/20 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="flex w-full items-center justify-between px-6 py-5 text-left text-zinc-800 dark:text-zinc-250 focus:outline-none"
                  >
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{faq.question}</span>
                    <span className="ml-4 flex-shrink-0 text-zinc-400 hover:text-indigo-500">
                      <svg
                        className={`h-5 w-5 transform transition-transform duration-250 ${isOpen ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </span>
                  </button>
                  <div
                    className={`transition-all duration-300 ease-in-out ${
                      isOpen ? "max-h-60 border-t border-zinc-200 dark:border-zinc-850 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                    }`}
                  >
                    <div className="px-6 py-5 text-sm text-zinc-650 dark:text-zinc-400 leading-relaxed font-light">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About CTA */}
      <section className="py-16 bg-zinc-50 dark:bg-zinc-950/20 transition-colors duration-300">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl">Want to know more about integration limits?</h2>
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400 font-light max-w-md mx-auto">
            Drop us a message, and our developer team will explain custom storage setup details.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/contact"
              className="rounded-full bg-indigo-650 dark:bg-indigo-500 hover:bg-indigo-550 dark:hover:bg-indigo-400 px-8 py-3 text-sm font-semibold text-white transition-all hover:scale-105"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
