"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { updateStudio, isStudioSlugUnique, uploadStudioImage } from "@/lib/studioService";
import { useStudio } from "@/context/StudioContext";
import { motion } from "motion/react";

export default function StudioSettings() {
  const { user, loading: authLoading } = useAuth();
  const { currentStudio, refreshStudios } = useStudio();
  const router = useRouter();

  const [studio, setStudio] = useState(null);
  const [formData, setFormData] = useState({
    studioName: "",
    studioSlug: "",
    description: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    instagram: "",
    facebook: "",
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");

  const [errors, setErrors] = useState({});
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Redirect if unauthenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadStudioData() {
      if (!currentStudio) {
        setIsFetching(false);
        return;
      }
      try {
        const s = currentStudio;
        setStudio(s);
        setFormData({
          studioName: s.studioName || "",
          studioSlug: s.studioSlug || "",
          description: s.description || "",
          email: s.email || "",
          phone: s.phone || "",
          location: s.location || "",
          website: s.website || "",
          instagram: s.instagram || "",
          facebook: s.facebook || "",
        });
        setLogoPreview(s.logo || "");
        setCoverPreview(s.coverImage || "");
      } catch (err) {
        console.error("Failed to load studio details:", err);
        setSaveError("Error loading studio details.");
      } finally {
        setIsFetching(false);
      }
    }
    loadStudioData();
  }, [currentStudio]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let val = value;
    if (name === "studioSlug") {
      val = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    }
    setFormData((prev) => ({ ...prev, [name]: val }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (saveSuccess) setSaveSuccess(false);
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, [type]: "Image size must be less than 5MB." }));
        return;
      }
      if (type === "logo") {
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
      } else {
        setCoverFile(file);
        setCoverPreview(URL.createObjectURL(file));
      }
      setErrors((prev) => ({ ...prev, [type]: "" }));
      if (saveSuccess) setSaveSuccess(false);
    }
  };

  const validateForm = async () => {
    const tempErrors = {};
    if (!formData.studioName.trim()) {
      tempErrors.studioName = "Studio Name is required.";
    }

    const slug = formData.studioSlug.trim();
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slug) {
      tempErrors.studioSlug = "Studio Slug is required.";
    } else if (!slugRegex.test(slug)) {
      tempErrors.studioSlug = "Slug must contain only lowercase letters, numbers, and hyphens.";
    } else {
      const isUnique = await isStudioSlugUnique(slug, studio.studioId);
      if (!isUnique) {
        tempErrors.studioSlug = "This slug is already taken.";
      }
    }

    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        tempErrors.email = "Please enter a valid email address.";
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = await validateForm();
    if (!isValid) return;

    setIsSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    try {
      let logoUrl = logoPreview;
      let coverUrl = coverPreview;

      if (logoFile) {
        logoUrl = await uploadStudioImage(logoFile, "logo", studio.studioId);
      }
      if (coverFile) {
        coverUrl = await uploadStudioImage(coverFile, "cover", studio.studioId);
      }

      const updatedPayload = {
        ...formData,
        logo: logoUrl,
        coverImage: coverUrl,
      };

      await updateStudio(studio.studioId, updatedPayload);
      await refreshStudios();
      setSaveSuccess(true);
      
      // Update local preview states with final URL
      setLogoPreview(logoUrl);
      setCoverPreview(coverUrl);
      setLogoFile(null);
      setCoverFile(null);
    } catch (err) {
      console.error("Failed to update studio settings:", err);
      setSaveError(err.message || "Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !user || isFetching) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#F7F7F7] dark:bg-[#181818] transition-colors duration-300">
        <div className="flex flex-col items-center gap-2">
          <svg className="animate-spin h-8 w-8 text-[#D4AF37]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm text-[#8E8E8E] font-medium">Loading Studio details...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 bg-[#F7F7F7] dark:bg-[#181818] min-h-screen transition-colors duration-300 text-left"
    >
      <div className="flex items-center gap-4 border-b border-zinc-200/50 pb-5 dark:border-zinc-800/40">
        <Link
          href="/dashboard/studio"
          className="rounded-[12px] border border-zinc-200/60 bg-white p-2.5 text-zinc-550 hover:bg-zinc-100 dark:border-zinc-850 dark:bg-[#262626] dark:hover:bg-[#2D2D2D] transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-headline">
            Studio Settings
          </h1>
          <p className="text-xs text-[#8E8E8E] font-light mt-0.5">Modify branding assets and parameters.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {saveError && (
          <div className="rounded-[12px] bg-rose-50 border border-rose-200/80 p-4 dark:bg-rose-950/20 dark:border-rose-900/50 flex items-start gap-3 animate-fade-in">
            <svg className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-rose-800 dark:text-rose-455">Save Error</p>
              <p className="text-xs text-rose-650 dark:text-rose-400 font-light mt-0.5 leading-relaxed">{saveError}</p>
            </div>
          </div>
        )}

        {saveSuccess && (
          <div className="rounded-[12px] bg-emerald-50 border border-emerald-200/80 p-4 dark:bg-emerald-950/20 dark:border-emerald-900/50 flex items-start gap-3 animate-fade-in">
            <svg className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 font-headline">Settings Saved</p>
              <p className="text-xs text-emerald-750 dark:text-emerald-400 font-light mt-0.5">Your studio profile has been updated successfully.</p>
            </div>
          </div>
        )}

        {/* Visual Brand Uploads */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Logo Card */}
          <div className="rounded-[20px] border border-zinc-200/60 bg-white p-6 dark:border-zinc-800/40 dark:bg-[#262626] flex flex-col items-center">
            <label className="text-xs font-bold uppercase tracking-wider text-[#8E8E8E] mb-4 block">Studio Logo</label>
            <div className="relative h-24 w-24 rounded-full bg-zinc-150 dark:bg-[#181818] border border-zinc-200/60 dark:border-zinc-800 overflow-hidden flex items-center justify-center">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo Preview" className="h-full w-full object-cover" />
              ) : (
                <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              )}
            </div>
            <label className="mt-4 rounded-[12px] bg-white border border-zinc-200/60 dark:border-zinc-800/40 dark:bg-[#262626] dark:hover:bg-[#2D2D2D] px-4 py-2.5 text-xs font-bold text-[#D4AF37] hover:bg-zinc-55 cursor-pointer shadow-xs select-none">
              Change Logo
              <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "logo")} className="hidden" />
            </label>
            {errors.logo && <p className="text-[11px] text-rose-500 mt-2 font-medium">{errors.logo}</p>}
          </div>

          {/* Cover Photo Card */}
          <div className="rounded-[20px] border border-zinc-200/60 bg-white p-6 dark:border-zinc-800/40 dark:bg-[#262626] flex flex-col items-center">
            <label className="text-xs font-bold uppercase tracking-wider text-[#8E8E8E] mb-4 block">Cover Photo</label>
            <div className="relative aspect-video w-full rounded-[12px] bg-zinc-150 dark:bg-[#181818] border border-zinc-200/60 dark:border-zinc-800 overflow-hidden flex items-center justify-center">
              {coverPreview ? (
                <img src={coverPreview} alt="Cover Preview" className="h-full w-full object-cover" />
              ) : (
                <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              )}
            </div>
            <label className="mt-4 rounded-[12px] bg-white border border-zinc-200/60 dark:border-zinc-800/40 dark:bg-[#262626] dark:hover:bg-[#2D2D2D] px-4 py-2.5 text-xs font-bold text-[#D4AF37] hover:bg-zinc-55 cursor-pointer shadow-xs select-none">
              Change Cover
              <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "coverImage")} className="hidden" />
            </label>
            {errors.coverImage && <p className="text-[11px] text-rose-500 mt-2 font-medium">{errors.coverImage}</p>}
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-[#262626] p-6 rounded-[20px] border border-zinc-200/50 dark:border-zinc-800/40">
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#8E8E8E]">Studio Name *</label>
            <input
              type="text"
              name="studioName"
              value={formData.studioName}
              onChange={handleInputChange}
              className={`rounded-[12px] border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-[#D4AF37] dark:border-zinc-800 dark:bg-[#181818] dark:text-zinc-100 ${
                errors.studioName ? "border-rose-500 focus:ring-rose-500" : ""
              }`}
            />
            {errors.studioName && <p className="text-[11px] text-rose-500">{errors.studioName}</p>}
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#8E8E8E]">Studio URL Slug *</label>
            <input
              type="text"
              name="studioSlug"
              value={formData.studioSlug}
              onChange={handleInputChange}
              className={`rounded-[12px] border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-[#D4AF37] dark:border-zinc-800 dark:bg-[#181818] dark:text-zinc-100 ${
                errors.studioSlug ? "border-rose-500 focus:ring-rose-500" : ""
              }`}
            />
            {errors.studioSlug && <p className="text-[11px] text-rose-500">{errors.studioSlug}</p>}
          </div>

          <div className="flex flex-col space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#8E8E8E]">Studio Description</label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              className="rounded-[12px] border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-[#D4AF37] dark:border-zinc-800 dark:bg-[#181818] dark:text-zinc-100 resize-none"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#8E8E8E]">Contact Email</label>
            <input
              type="text"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`rounded-[12px] border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-[#D4AF37] dark:border-zinc-800 dark:bg-[#181818] dark:text-zinc-100 ${
                errors.email ? "border-rose-500 focus:ring-rose-500" : ""
              }`}
            />
            {errors.email && <p className="text-[11px] text-rose-500">{errors.email}</p>}
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#8E8E8E]">Phone Number</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="rounded-[12px] border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-[#D4AF37] dark:border-zinc-800 dark:bg-[#181818] dark:text-zinc-100"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#8E8E8E]">Studio Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="rounded-[12px] border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-[#D4AF37] dark:border-zinc-800 dark:bg-[#181818] dark:text-zinc-100"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#8E8E8E]">Website URL</label>
            <input
              type="text"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              className="rounded-[12px] border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-[#D4AF37] dark:border-zinc-800 dark:bg-[#181818] dark:text-zinc-100"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#8E8E8E]">Instagram Handle</label>
            <input
              type="text"
              name="instagram"
              value={formData.instagram}
              onChange={handleInputChange}
              className="rounded-[12px] border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-[#D4AF37] dark:border-zinc-800 dark:bg-[#181818] dark:text-zinc-100"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#8E8E8E]">Facebook Page URL</label>
            <input
              type="text"
              name="facebook"
              value={formData.facebook}
              onChange={handleInputChange}
              className="rounded-[12px] border border-[#202020] bg-white px-4 py-3 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-[#D4AF37] dark:border-zinc-800 dark:bg-[#181818] dark:text-zinc-100"
            />
          </div>
        </div>

        {/* Action Panel buttons */}
        <div className="pt-6 border-t border-zinc-200/50 dark:border-zinc-800/40 flex items-center justify-end gap-3">
          <Link
            href="/dashboard/studio"
            className="rounded-[12px] border border-zinc-255 bg-white px-5 py-2.5 text-xs font-bold text-zinc-650 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-[#262626] dark:text-zinc-350 dark:hover:bg-[#2D2D2D] transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className={`rounded-[12px] bg-[#D4AF37] hover:bg-[#E0C55B] px-6 py-2.5 text-xs font-bold text-[#181818] shadow-md hover:shadow-lg transition-all ${
              isSaving ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
