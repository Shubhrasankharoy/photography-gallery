"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { createStudio, isStudioSlugUnique, uploadStudioImage } from "@/lib/studioService";

export default function NewStudio() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if unauthenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

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
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let val = value;
    if (name === "studioSlug") {
      // Automatically sanitize slug
      val = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    }
    setFormData((prev) => ({ ...prev, [name]: val }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
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
      const isUnique = await isStudioSlugUnique(slug);
      if (!isUnique) {
        tempErrors.studioSlug = "This slug is already taken.";
      }
    }

    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
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

    try {
      let logoUrl = "";
      let coverUrl = "";

      // We need to upload images. Note: uploadStudioImage takes studioId.
      // But we haven't generated studioId yet. Let's write standard logic
      // where we pass a placeholder or upload to a temporary folder or upload after creation.
      // Better: we can pass "temp" to uploadStudioImage, then save, or generate a doc ID first.
      // Let's generate a temporary ID, or we can use the user's uid as path segment.
      // Let's upload to a folder named under user's uid first, then move, or just user.uid is perfectly clean!
      if (logoFile) {
        logoUrl = await uploadStudioImage(logoFile, "logo", user.uid);
      }
      if (coverFile) {
        coverUrl = await uploadStudioImage(coverFile, "cover", user.uid);
      }

      const studioPayload = {
        ...formData,
        logo: logoUrl,
        coverImage: coverUrl,
      };

      await createStudio(user.uid, studioPayload);
      router.push("/dashboard/studio");
    } catch (err) {
      console.error("Failed to create studio:", err);
      setSaveError(err.message || "Failed to create studio.");
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-zinc-50 dark:bg-black transition-colors duration-300">
        <div className="flex flex-col items-center gap-2">
          <svg className="animate-spin h-8 w-8 text-indigo-650" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm text-zinc-550">Loading workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-black min-h-screen transition-colors duration-300">
      <div className="flex items-center gap-3 border-b border-zinc-200 pb-5 dark:border-zinc-850">
        <Link
          href="/dashboard/studio"
          className="rounded-full border border-zinc-200 bg-white p-2 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-850 dark:bg-zinc-950 dark:hover:bg-zinc-900"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Create Your Studio
          </h1>
          <p className="text-xs text-zinc-455 font-light mt-0.5">Establish a new brand space and team hub.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {saveError && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200/80 p-4 dark:bg-rose-950/20 dark:border-rose-900/50 flex items-start gap-3">
            <svg className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-rose-800 dark:text-rose-400">Creation Error</p>
              <p className="text-xs text-rose-650 dark:text-rose-455 font-light mt-0.5 leading-relaxed">{saveError}</p>
            </div>
          </div>
        )}

        {/* Visual Brand Uploads */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Logo Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-850 dark:bg-zinc-950/20 flex flex-col items-center">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4 block">Studio Logo</label>
            <div className="relative h-24 w-24 rounded-full bg-zinc-150 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden flex items-center justify-center">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo Preview" className="h-full w-full object-cover" />
              ) : (
                <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              )}
            </div>
            <label className="mt-4 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 cursor-pointer shadow-xs">
              Upload Logo
              <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "logo")} className="hidden" />
            </label>
            {errors.logo && <p className="text-[11px] text-rose-500 mt-2 font-medium">{errors.logo}</p>}
          </div>

          {/* Cover Photo Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-850 dark:bg-zinc-950/20 flex flex-col items-center">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4 block">Cover Photo</label>
            <div className="relative aspect-video w-full rounded-xl bg-zinc-150 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden flex items-center justify-center">
              {coverPreview ? (
                <img src={coverPreview} alt="Cover Preview" className="h-full w-full object-cover" />
              ) : (
                <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              )}
            </div>
            <label className="mt-4 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 cursor-pointer shadow-xs">
              Upload Cover
              <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "coverImage")} className="hidden" />
            </label>
            {errors.coverImage && <p className="text-[11px] text-rose-500 mt-2 font-medium">{errors.coverImage}</p>}
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-zinc-950/20 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-850">
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Studio Name *</label>
            <input
              type="text"
              name="studioName"
              value={formData.studioName}
              onChange={handleInputChange}
              className={`rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-850 dark:bg-zinc-950 dark:text-zinc-100 ${
                errors.studioName ? "border-rose-500 focus:ring-rose-500" : ""
              }`}
              placeholder="E.g., Aura Studios"
            />
            {errors.studioName && <p className="text-[11px] text-rose-500">{errors.studioName}</p>}
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Studio URL Slug *</label>
            <input
              type="text"
              name="studioSlug"
              value={formData.studioSlug}
              onChange={handleInputChange}
              className={`rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-850 dark:bg-zinc-950 dark:text-zinc-100 ${
                errors.studioSlug ? "border-rose-500 focus:ring-rose-500" : ""
              }`}
              placeholder="e.g., aura-studios"
            />
            {errors.studioSlug && <p className="text-[11px] text-rose-500">{errors.studioSlug}</p>}
          </div>

          <div className="flex flex-col space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Studio Description</label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-850 dark:bg-zinc-950 dark:text-zinc-100 resize-none"
              placeholder="Describe your studio's creative focus, values, or team style..."
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Contact Email</label>
            <input
              type="text"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-850 dark:bg-zinc-950 dark:text-zinc-100 ${
                errors.email ? "border-rose-500 focus:ring-rose-500" : ""
              }`}
              placeholder="hello@aurastudios.com"
            />
            {errors.email && <p className="text-[11px] text-rose-500">{errors.email}</p>}
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Phone Number</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-850 dark:bg-zinc-950 dark:text-zinc-100"
              placeholder="+1 (555) 019-2834"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Studio Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-850 dark:bg-zinc-950 dark:text-zinc-100"
              placeholder="Los Angeles, CA"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Website URL</label>
            <input
              type="text"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-850 dark:bg-zinc-950 dark:text-zinc-100"
              placeholder="https://aurastudios.com"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Instagram Handle</label>
            <input
              type="text"
              name="instagram"
              value={formData.instagram}
              onChange={handleInputChange}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-850 dark:bg-zinc-950 dark:text-zinc-100"
              placeholder="aurastudios"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Facebook Page URL</label>
            <input
              type="text"
              name="facebook"
              value={formData.facebook}
              onChange={handleInputChange}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-850 dark:bg-zinc-950 dark:text-zinc-100"
              placeholder="https://facebook.com/aurastudios"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-850 flex items-center justify-end gap-3">
          <Link
            href="/dashboard/studio"
            className="rounded-full border border-zinc-250 bg-white px-5 py-2.5 text-xs font-bold text-zinc-650 hover:bg-zinc-50 dark:border-zinc-850 dark:bg-zinc-950 dark:hover:bg-zinc-900"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className={`rounded-full bg-indigo-650 hover:bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all ${
              isSaving ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {isSaving ? "Creating Studio..." : "Create Studio"}
          </button>
        </div>
      </form>
    </div>
  );
}
