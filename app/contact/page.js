"use client";

import { useState } from "react";
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

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear errors as user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const tempErrors = {};
    if (!formData.name.trim()) {
      tempErrors.name = "Name is required.";
    } else if (formData.name.trim().length < 2) {
      tempErrors.name = "Name must be at least 2 characters.";
    }

    if (!formData.email.trim()) {
      tempErrors.email = "Email is required.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        tempErrors.email = "Please enter a valid email address.";
      }
    }

    if (!formData.subject.trim()) {
      tempErrors.subject = "Subject is required.";
    }

    if (!formData.message.trim()) {
      tempErrors.message = "Message is required.";
    } else if (formData.message.trim().length < 10) {
      tempErrors.message = "Message must be at least 10 characters.";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    // Simulate server request
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });

      // Clear success banner after 5 seconds
      setTimeout(() => {
        setIsSuccess(false);
      }, 5000);
    }, 1500);
  };

  const inputClasses = (fieldName) =>
    `rounded-[12px] border bg-transparent px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 transition-all ${
      errors[fieldName]
        ? "border-rose-500 focus:ring-rose-500"
        : "border-zinc-200 focus:ring-[#D4AF37] dark:border-zinc-800"
    }`;

  const contactCards = [
    {
      title: "Studio Head Office",
      content: (
        <p className="mt-1.5 text-xs text-[#8E8E8E] leading-relaxed font-light">
          Suite 408, Creative Tech Hub<br />
          Hudson Yards, New York, NY 10001
        </p>
      ),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      ),
    },
    {
      title: "Contact Emails",
      content: (
        <p className="mt-1.5 text-xs text-[#8E8E8E] font-light space-y-1">
          <span className="block">General Support: <a href="mailto:support@capturespace.com" className="hover:text-[#D4AF37] underline font-semibold transition-colors">support@capturespace.com</a></span>
          <span className="block">Enterprise: <a href="mailto:studios@capturespace.com" className="hover:text-[#D4AF37] underline font-semibold transition-colors">studios@capturespace.com</a></span>
        </p>
      ),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0l-7.5-4.615a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      ),
    },
    {
      title: "Active Hours",
      content: (
        <p className="mt-1.5 text-xs text-[#8E8E8E] leading-relaxed font-light">
          Mon &ndash; Fri, 9:00 AM &ndash; 6:00 PM EST.<br />
          Response SLA for Pro plans: &lt; 4 Hours.
        </p>
      ),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full min-h-screen bg-white dark:bg-[#181818] transition-colors duration-300">
      
      {/* Page Header */}
      <section className="py-16 bg-[#F7F7F7] dark:bg-[#202020] transition-colors duration-300">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center"
        >
          <motion.span variants={fadeUp} className="text-xs font-bold tracking-widest text-[#D4AF37] uppercase">
            Get In Touch
          </motion.span>
          <motion.h1 variants={fadeUp} className="mt-4 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl leading-tight font-headline">
            Connect With CaptureSpace
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-4 max-w-xl text-base text-[#8E8E8E] font-light leading-relaxed">
            Have questions about pricing, storage options, or customized studio workflows? Send us a message, and our team will follow up quickly.
          </motion.p>
        </motion.div>
      </section>

      {/* Main Grid Content */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
            
            {/* Contact Info Cards (Left - span 5) */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={staggerContainer}
              className="lg:col-span-5 flex flex-col space-y-8"
            >
              <motion.div variants={fadeUp} className="flex flex-col space-y-3">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 font-headline">Support & Operations</h2>
                <p className="text-sm text-[#8E8E8E] leading-relaxed font-light">
                  We are available for integrations, onboarding support, and general platform inquiries.
                </p>
              </motion.div>

              {/* Detail cards */}
              <div className="space-y-6">
                {contactCards.map((card, i) => (
                  <motion.div
                    key={card.title}
                    variants={fadeUp}
                    custom={i}
                    whileHover={{ y: -2, transition: { duration: 0.15 } }}
                    className="flex items-start gap-4 p-5 rounded-[20px] border border-zinc-100 bg-[#FAFAFA] dark:border-zinc-800/40 dark:bg-[#202020] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lg)] transition-all"
                  >
                    <div className="rounded-[12px] bg-[#D4AF37]/10 p-2.5 text-[#D4AF37]">
                      {card.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-200">{card.title}</h4>
                      {card.content}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Interactive Form Card (Right - span 7) */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-7"
            >
              <div className="rounded-[24px] border border-zinc-200 bg-white p-8 shadow-[var(--shadow-lg)] dark:border-zinc-800/40 dark:bg-[#262626]">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-6 font-headline">Send a Secure Message</h3>
                
                <AnimatePresence>
                  {isSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="mb-6 rounded-[20px] bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-300 flex items-start gap-3"
                    >
                      <svg className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.746 3.746 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                      </svg>
                      <div>
                        <p className="text-sm font-bold">Message sent successfully!</p>
                        <p className="mt-1 text-xs font-light">Thank you for reaching out. A client specialist will follow up at your email shortly.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-5">
                  {/* Name & Email Group */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Name */}
                    <div className="flex flex-col space-y-1.5">
                      <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-[#8E8E8E]">Name</label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSubmit(e);
                        }}
                        className={inputClasses("name")}
                        placeholder="John Doe"
                      />
                      {errors.name && <span className="text-xs text-rose-500 mt-1 font-medium">{errors.name}</span>}
                    </div>

                    {/* Email */}
                    <div className="flex flex-col space-y-1.5">
                      <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-[#8E8E8E]">Email Address</label>
                      <input
                        id="email"
                        name="email"
                        type="text"
                        value={formData.email}
                        onChange={handleChange}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSubmit(e);
                        }}
                        className={inputClasses("email")}
                        placeholder="john@example.com"
                      />
                      {errors.email && <span className="text-xs text-rose-500 mt-1 font-medium">{errors.email}</span>}
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="flex flex-col space-y-1.5">
                    <label htmlFor="subject" className="text-xs font-bold uppercase tracking-wider text-[#8E8E8E]">Subject</label>
                    <input
                      id="subject"
                      name="subject"
                      type="text"
                      value={formData.subject}
                      onChange={handleChange}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSubmit(e);
                      }}
                      className={inputClasses("subject")}
                      placeholder="Pricing inquiry, feature request..."
                    />
                    {errors.subject && <span className="text-xs text-rose-500 mt-1 font-medium">{errors.subject}</span>}
                  </div>

                  {/* Message */}
                  <div className="flex flex-col space-y-1.5">
                    <label htmlFor="message" className="text-xs font-bold uppercase tracking-wider text-[#8E8E8E]">Message Body</label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      className={`${inputClasses("message")} resize-none`}
                      placeholder="Write details of your studio or question..."
                    />
                    {errors.message && <span className="text-xs text-rose-500 mt-1 font-medium">{errors.message}</span>}
                  </div>

                  {/* Submit Button */}
                  <motion.span
                    role="button"
                    tabIndex={0}
                    onClick={handleSubmit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleSubmit(e);
                      }
                    }}
                    whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                    className={`w-full mt-4 flex items-center justify-center rounded-[12px] bg-[#D4AF37] py-4 text-sm font-bold text-[#181818] hover:bg-[#E0C55B] transition-all select-none cursor-pointer text-center ${
                      isSubmitting ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        {/* Spinner icon */}
                        <svg className="animate-spin h-5 w-5 text-[#181818]" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Encrypting & Sending...
                      </span>
                    ) : (
                      "Send Message"
                    )}
                  </motion.span>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

    </div>
  );
}
