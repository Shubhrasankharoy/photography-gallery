"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { 
  getProfileByUid, 
  isUsernameUnique, 
  uploadProfileImage, 
  saveProfile 
} from "@/lib/profileService";

export default function ProfileEditor() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Form State
  const [formData, setFormData] = useState({
    studioName: "",
    photographerName: "",
    username: "",
    bio: "",
    phone: "",
    email: "",
    location: "",
    website: "",
    instagram: "",
    facebook: "",
  });

  // Current database values for images
  const [currentImages, setCurrentImages] = useState({
    logo: "",
    coverImage: "",
  });

  // Files selected for upload
  const [selectedFiles, setSelectedFiles] = useState({
    logo: null,
    coverImage: null,
  });

  // Preview URLs
  const [previews, setPreviews] = useState({
    logo: "",
    coverImage: "",
  });

  const [errors, setErrors] = useState({});
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const logoInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // Redirect if unauthenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  // Load existing profile details
  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      try {
        const data = await getProfileByUid(user.uid);
        if (data) {
          setFormData({
            studioName: data.studioName || "",
            photographerName: data.photographerName || "",
            username: data.username || "",
            bio: data.bio || "",
            phone: data.phone || "",
            email: data.email || user.email || "",
            location: data.location || "",
            website: data.website || "",
            instagram: data.instagram || "",
            facebook: data.facebook || "",
          });
          setCurrentImages({
            logo: data.logo || "",
            coverImage: data.coverImage || "",
          });
        } else {
          // Default email
          setFormData((prev) => ({ ...prev, email: user.email || "" }));
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
        setErrorMessage("Could not load your profile details. Please refresh.");
      } finally {
        setIsFetching(false);
      }
    }
    
    if (user) {
      loadProfile();
    }
  }, [user]);

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previews.logo) URL.revokeObjectURL(previews.logo);
      if (previews.coverImage) URL.revokeObjectURL(previews.coverImage);
    };
  }, [previews]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (saveSuccess) setSaveSuccess(false);
    if (errorMessage) setErrorMessage("");
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type is image
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, [type]: "File must be an image." }));
      return;
    }

    // Max size 5MB
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, [type]: "Image size must be less than 5MB." }));
      return;
    }

    setSelectedFiles((prev) => ({ ...prev, [type]: file }));
    
    // Revoke old object URL if exists
    if (previews[type]) {
      URL.revokeObjectURL(previews[type]);
    }
    
    setPreviews((prev) => ({ ...prev, [type]: URL.createObjectURL(file) }));
    if (errors[type]) {
      setErrors((prev) => ({ ...prev, [type]: "" }));
    }
    if (saveSuccess) setSaveSuccess(false);
  };

  const validateForm = () => {
    const tempErrors = {};
    if (!formData.photographerName.trim()) {
      tempErrors.photographerName = "Photographer Name is required.";
    }

    // Username validation: lowercase letters, numbers, and hyphens only
    const usernameRegex = /^[a-z0-9-]+$/;
    if (!formData.username.trim()) {
      tempErrors.username = "Username URL handle is required.";
    } else if (!usernameRegex.test(formData.username)) {
      tempErrors.username = "Username must contain only lowercase letters, numbers, and hyphens (no spaces or capital letters).";
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

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    setErrorMessage("");
    setSaveSuccess(false);

    try {
      // 1. Verify Username Uniqueness
      const unique = await isUsernameUnique(formData.username, user.uid);
      if (!unique) {
        setErrors((prev) => ({
          ...prev,
          username: "This username is already taken. Please choose another one.",
        }));
        setIsSaving(false);
        return;
      }

      // 2. Upload Images to Storage if selected
      let uploadedLogoUrl = currentImages.logo;
      let uploadedCoverUrl = currentImages.coverImage;

      if (selectedFiles.logo) {
        try {
          uploadedLogoUrl = await uploadProfileImage(selectedFiles.logo, "logo", user.uid);
        } catch (uploadErr) {
          console.error("Logo upload failed:", uploadErr);
          // If storage permissions fail, warn the user but keep saving, fallback to local URL
          throw new Error("Failed to upload Logo to storage. Please check your storage rules.");
        }
      }

      if (selectedFiles.coverImage) {
        try {
          uploadedCoverUrl = await uploadProfileImage(selectedFiles.coverImage, "coverImage", user.uid);
        } catch (uploadErr) {
          console.error("Cover image upload failed:", uploadErr);
          throw new Error("Failed to upload Cover Image to storage. Please check your storage rules.");
        }
      }

      // 3. Save Profile doc to Firestore
      const profileData = {
        ...formData,
        logo: uploadedLogoUrl,
        coverImage: uploadedCoverUrl,
      };

      await saveProfile(user.uid, profileData);
      
      // Update local storage states
      setCurrentImages({
        logo: uploadedLogoUrl,
        coverImage: uploadedCoverUrl,
      });
      // Clear files
      setSelectedFiles({ logo: null, coverImage: null });
      setSaveSuccess(true);
    } catch (err) {
      console.error("Profile save failed:", err);
      setErrorMessage(err.message || "An error occurred while saving your profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !user || isFetching) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <svg className="animate-spin h-8 w-8 text-indigo-650" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm text-zinc-550">Fetching profile workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-zinc-50 dark:bg-black py-10 transition-colors duration-300">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        
        {/* Header Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
          <Link href="/dashboard" className="hover:text-zinc-900 dark:hover:text-zinc-200">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-zinc-800 dark:text-zinc-200">Profile settings</span>
        </div>

        <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-200 pb-6 dark:border-zinc-800">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              Photographer Profile
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 font-light">
              Customize your public branding, credentials, and social links.
            </p>
          </div>
          
          {formData.username && (
            <Link
              href={`/photographer/${formData.username}`}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-350 dark:border-zinc-800 bg-white hover:bg-zinc-50 px-5 py-2 text-xs font-bold text-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 transition-all select-none"
            >
              <span>View Public Profile</span>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </Link>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-6 rounded-2xl bg-rose-50 border border-rose-200/80 p-4 dark:bg-rose-950/20 dark:border-rose-900/50 flex items-start gap-3 animate-fade-in">
            <svg className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-xs font-bold text-rose-800 dark:text-rose-455 uppercase tracking-wider">Save Failed</p>
              <p className="mt-1 text-xs text-rose-650 dark:text-rose-400 font-light leading-relaxed">
                {errorMessage}
              </p>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {saveSuccess && (
          <div className="mt-6 rounded-2xl bg-emerald-50 border border-emerald-200/80 p-4 dark:bg-emerald-950/20 dark:border-emerald-900/50 flex items-start gap-3 animate-fade-in">
            <svg className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.746 3.746 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
            <div>
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-455 uppercase tracking-wider">Changes Saved</p>
              <p className="mt-1 text-xs text-emerald-650 dark:text-emerald-400 font-light leading-relaxed">
                Your portfolio details have been updated. View the live changes at{" "}
                <Link href={`/photographer/${formData.username}`} className="font-bold underline">
                  /photographer/{formData.username}
                </Link>.
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Visual branding uploads (logo & cover) */}
          <div className="space-y-6 lg:col-span-1">
            
            {/* Cover Image Upload Card */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-850 dark:bg-zinc-950/20">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider mb-4">Cover Image</h3>
              
              <div className="relative aspect-video rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden flex items-center justify-center">
                {previews.coverImage || currentImages.coverImage ? (
                  <img
                    src={previews.coverImage || currentImages.coverImage}
                    alt="Cover preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4">
                    <svg className="mx-auto h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375 .375 0 11-.75 0 .375 .375 0 017 0z" />
                    </svg>
                    <span className="mt-1 block text-xs text-zinc-400 font-light">No image set</span>
                  </div>
                )}
              </div>

              <input
                type="file"
                ref={coverInputRef}
                onChange={(e) => handleFileChange(e, "coverImage")}
                className="hidden"
                accept="image/*"
              />
              
              <span
                role="button"
                tabIndex={0}
                onClick={() => coverInputRef.current.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") coverInputRef.current.click();
                }}
                className="mt-4 flex w-full justify-center rounded-xl border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 py-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-350 cursor-pointer select-none text-center"
              >
                Choose Cover File
              </span>
              {errors.coverImage && <p className="text-[11px] text-rose-500 mt-2 font-medium">{errors.coverImage}</p>}
            </div>

            {/* Logo Image Upload Card */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-850 dark:bg-zinc-950/20">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider mb-4">Studio Logo / Avatar</h3>
              
              <div className="flex justify-center">
                <div className="relative h-24 w-24 rounded-full bg-zinc-150 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden flex items-center justify-center">
                  {previews.logo || currentImages.logo ? (
                    <img
                      src={previews.logo || currentImages.logo}
                      alt="Logo preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <svg className="mx-auto h-6 w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              <input
                type="file"
                ref={logoInputRef}
                onChange={(e) => handleFileChange(e, "logo")}
                className="hidden"
                accept="image/*"
              />

              <span
                role="button"
                tabIndex={0}
                onClick={() => logoInputRef.current.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") logoInputRef.current.click();
                }}
                className="mt-4 flex w-full justify-center rounded-xl border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 py-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-350 cursor-pointer select-none text-center"
              >
                Choose Logo File
              </span>
              {errors.logo && <p className="text-[11px] text-rose-500 mt-2 font-medium">{errors.logo}</p>}
            </div>

          </div>

          {/* Right Column: Form Inputs */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-850 dark:bg-zinc-950/20">
              
              <div className="space-y-6">
                
                {/* Branding Section */}
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 pb-2 border-b border-zinc-150 dark:border-zinc-850">Branding</h3>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Photographer Name */}
                    <div className="flex flex-col space-y-1.5">
                      <label htmlFor="photographerName" className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Photographer Name</label>
                      <input
                        id="photographerName"
                        name="photographerName"
                        type="text"
                        value={formData.photographerName}
                        onChange={handleInputChange}
                        className={`rounded-xl border bg-transparent px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 transition-all ${
                          errors.photographerName ? "border-rose-500 focus:ring-rose-500" : "border-zinc-200 focus:ring-indigo-500 dark:border-zinc-800 dark:focus:border-indigo-400"
                        }`}
                        placeholder="Alex Carter"
                      />
                      {errors.photographerName && <span className="text-xs text-rose-500 mt-1 font-medium">{errors.photographerName}</span>}
                    </div>
                  </div>

                  {/* Username Slug */}
                  <div className="mt-4 flex flex-col space-y-1.5">
                    <label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Public URL Handle (Username)</label>
                    <div className="relative flex rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500 dark:focus-within:ring-indigo-400">
                      <span className="flex items-center bg-zinc-100 dark:bg-zinc-900 px-4 text-sm text-zinc-500 border-r border-zinc-200 dark:border-zinc-800 select-none">
                        capturespace.com/photographer/
                      </span>
                      <input
                        id="username"
                        name="username"
                        type="text"
                        value={formData.username}
                        onChange={(e) => {
                          // Automatically sanitize to lowercase slug
                          const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                          setFormData((prev) => ({ ...prev, username: sanitized }));
                          if (errors.username) setErrors((prev) => ({ ...prev, username: "" }));
                        }}
                        className={`grow bg-transparent px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none ${
                          errors.username ? "border-rose-500 focus:ring-rose-500" : ""
                        }`}
                        placeholder="alex-carter"
                      />
                    </div>
                    {errors.username && <span className="text-xs text-rose-500 mt-1 font-medium">{errors.username}</span>}
                    <span className="text-[10px] text-zinc-450 font-light">This defines your SEO friendly profile address (letters, numbers, hyphens only).</span>
                  </div>

                  {/* Bio */}
                  <div className="mt-4 flex flex-col space-y-1.5">
                    <label htmlFor="bio" className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Biography / Studio Description</label>
                    <textarea
                      id="bio"
                      name="bio"
                      rows={4}
                      value={formData.bio}
                      onChange={handleInputChange}
                      className="rounded-xl border border-zinc-200 bg-transparent px-4 py-2.5 text-sm text-zinc-900 dark:border-zinc-800 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:border-indigo-400 resize-none"
                      placeholder="Share your creative vision, studio achievements, and style focus..."
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 pb-2 border-b border-zinc-150 dark:border-zinc-850">Contact info</h3>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Email */}
                    <div className="flex flex-col space-y-1.5">
                      <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Public Contact Email</label>
                      <input
                        id="email"
                        name="email"
                        type="text"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`rounded-xl border bg-transparent px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 transition-all ${
                          errors.email ? "border-rose-500 focus:ring-rose-500" : "border-zinc-200 focus:ring-indigo-500 dark:border-zinc-800 dark:focus:border-indigo-400"
                        }`}
                        placeholder="studio@example.com"
                      />
                      {errors.email && <span className="text-xs text-rose-500 mt-1 font-medium">{errors.email}</span>}
                    </div>

                    {/* Phone */}
                    <div className="flex flex-col space-y-1.5">
                      <label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Phone number</label>
                      <input
                        id="phone"
                        name="phone"
                        type="text"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="rounded-xl border border-zinc-200 bg-transparent px-4 py-2.5 text-sm text-zinc-900 dark:border-zinc-800 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:border-indigo-400"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>

                    {/* Website */}
                    <div className="flex flex-col space-y-1.5">
                      <label htmlFor="website" className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Website URL</label>
                      <input
                        id="website"
                        name="website"
                        type="text"
                        value={formData.website}
                        onChange={handleInputChange}
                        className="rounded-xl border border-zinc-200 bg-transparent px-4 py-2.5 text-sm text-zinc-900 dark:border-zinc-800 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:border-indigo-400"
                        placeholder="https://aurastudios.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Social Media Links */}
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 pb-2 border-b border-zinc-150 dark:border-zinc-850">Social Media</h3>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Instagram */}
                    <div className="flex flex-col space-y-1.5">
                      <label htmlFor="instagram" className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Instagram Handle</label>
                      <div className="relative flex rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500 dark:focus-within:ring-indigo-400">
                        <span className="flex items-center bg-zinc-100 dark:bg-zinc-900 px-3 text-sm text-zinc-500 border-r border-zinc-200 dark:border-zinc-800 select-none">@</span>
                        <input
                          id="instagram"
                          name="instagram"
                          type="text"
                          value={formData.instagram}
                          onChange={handleInputChange}
                          className="grow bg-transparent px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none"
                          placeholder="aurastudios"
                        />
                      </div>
                    </div>

                    {/* Facebook */}
                    <div className="flex flex-col space-y-1.5">
                      <label htmlFor="facebook" className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Facebook Page URL</label>
                      <input
                        id="facebook"
                        name="facebook"
                        type="text"
                        value={formData.facebook}
                        onChange={handleInputChange}
                        className="rounded-xl border border-zinc-200 bg-transparent px-4 py-2.5 text-sm text-zinc-900 dark:border-zinc-800 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:border-indigo-400"
                        placeholder="https://facebook.com/aurastudios"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Submit buttons */}
                <div className="pt-6 border-t border-zinc-150 dark:border-zinc-850 flex items-center justify-end gap-3">
                  <Link
                    href="/dashboard"
                    className="rounded-xl border border-zinc-250 hover:bg-zinc-50 px-5 py-3 text-sm font-semibold text-zinc-700 dark:border-zinc-800 dark:hover:bg-zinc-900 dark:text-zinc-300 transition-all cursor-pointer"
                  >
                    Cancel
                  </Link>

                  <span
                    role="button"
                    tabIndex={0}
                    onClick={handleSave}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") handleSave();
                    }}
                    className={`flex items-center justify-center rounded-xl bg-zinc-950 dark:bg-zinc-50 dark:text-black px-6 py-3 text-sm font-bold text-white hover:bg-zinc-850 dark:hover:bg-zinc-200 transition-all select-none cursor-pointer text-center ${
                      isSaving ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    {isSaving ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white dark:text-black" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Saving Changes...
                      </span>
                    ) : (
                      "Save Profile"
                    )}
                  </span>
                </div>

              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
