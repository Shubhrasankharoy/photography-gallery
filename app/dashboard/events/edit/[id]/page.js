"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useStudio } from "@/context/StudioContext";
import { uploadProfileImage } from "@/lib/profileService";
import { getEventById, updateEvent } from "@/lib/eventService";
import { motion } from "motion/react";

export default function EditEvent({ params }) {
  const resolvedParams = React.use(params);
  const eventId = resolvedParams.id;

  const { user, loading: authLoading } = useAuth();
  const { currentStudio } = useStudio();
  const router = useRouter();

  // Redirect if unauthenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  const [formData, setFormData] = useState({
    eventName: "",
    brideName: "",
    groomName: "",
    eventDate: "",
    location: "",
    description: "",
    password: "",
    visibility: "public"
  });

  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [isFetching, setIsFetching] = useState(true);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Load existing event details
  useEffect(() => {
    async function loadEvent() {
      if (!eventId) return;
      try {
        const details = await getEventById(eventId);
        if (!details) {
          setSaveError("Event not found.");
          setIsFetching(false);
          return;
        }

        // Verify ownership and role-based editing permissions
        if (user) {
          if (details.studioId) {
            if (!currentStudio) {
              // Wait for currentStudio context to resolve
              return;
            }
            if (currentStudio.studioId !== details.studioId) {
              router.replace("/dashboard/events");
              return;
            }
            const role = currentStudio.userRole;
            if (role === "viewer") {
              router.replace("/dashboard/events");
              return;
            }
            if (role === "photographer" && details.createdBy !== user.uid) {
              router.replace("/dashboard/events");
              return;
            }
          } else {
            // Legacy check
            if (details.photographerId !== user.uid) {
              router.replace("/dashboard/events");
              return;
            }
          }
        }

        setFormData({
          eventName: details.eventName || "",
          brideName: details.brideName || "",
          groomName: details.groomName || "",
          eventDate: details.eventDate || "",
          location: details.location || "",
          description: details.description || "",
          password: details.password || "",
          visibility: details.visibility || "public"
        });

        if (details.coverImage) {
          setCoverImageUrl(details.coverImage);
          setCoverPreview(details.coverImage);
        }
      } catch (err) {
        console.error("Failed to load event details:", err);
        setSaveError("Error fetching event details.");
      } finally {
        setIsFetching(false);
      }
    }

    if (user && eventId) {
      loadEvent();
    }
  }, [user, eventId, router, currentStudio]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, coverImage: "Image file size must be less than 10MB." }));
        return;
      }
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
      setErrors((prev) => ({ ...prev, coverImage: "" }));
    }
  };

  const validateForm = () => {
    const tempErrors = {};
    if (!formData.eventName.trim()) {
      tempErrors.eventName = "Event name is required.";
    }
    
    // If private/PIN protected, password is required
    if (formData.visibility === "private" && !formData.password.trim()) {
      tempErrors.password = "A access passcode is required for PIN protected events.";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    setSaveError("");

    try {
      let finalCoverUrl = coverImageUrl;
      
      // If the photographer chose a new cover file, upload it
      if (coverFile) {
        finalCoverUrl = await uploadProfileImage(coverFile, "events", user.uid);
      }

      const finalEventData = {
        ...formData,
        coverImage: finalCoverUrl,
        updatedBy: user.uid
      };

      await updateEvent(eventId, finalEventData);
      router.push("/dashboard/events");
    } catch (err) {
      console.error("Failed to update event:", err);
      setSaveError(err.message || "Failed to update event.");
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
          <span className="text-sm text-[#8E8E8E] font-medium">Loading event details...</span>
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
      
      {/* Navigation Header bar */}
      <div className="flex items-center gap-4 border-b border-zinc-200/50 pb-5 dark:border-zinc-800/40">
        <Link
          href="/dashboard/events"
          className="rounded-[12px] border border-zinc-200/60 bg-white p-2.5 text-zinc-550 hover:bg-zinc-100 dark:border-zinc-850 dark:bg-[#262626] dark:hover:bg-[#2D2D2D] transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-headline">
            Edit Event Configuration
          </h1>
          <p className="text-xs text-[#8E8E8E] font-light mt-0.5">Modify parameters or swap gallery cover images.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="mt-8 space-y-6">
        
        {/* Error notification banner */}
        {saveError && (
          <div className="rounded-[12px] bg-rose-50 border border-rose-200/80 p-4 dark:bg-rose-950/20 dark:border-rose-900/50 flex items-start gap-3 animate-fade-in">
            <svg className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-rose-800 dark:text-rose-400">Save Error</p>
              <p className="text-xs text-rose-650 dark:text-rose-455 font-light mt-0.5 leading-relaxed">{saveError}</p>
            </div>
          </div>
        )}

        {/* Cover Photo Upload Block */}
        <div className="flex flex-col space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#8E8E8E]">Gallery Cover Photo</label>
          <div className="relative aspect-video w-full rounded-[20px] border border-dashed border-zinc-300 bg-white overflow-hidden flex flex-col items-center justify-center dark:border-zinc-800 dark:bg-[#262626] group">
            {coverPreview ? (
              <>
                <img src={coverPreview} alt="Cover Preview" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <label className="rounded-[12px] bg-white px-4 py-2.5 text-xs font-bold text-zinc-950 cursor-pointer hover:bg-zinc-100 shadow-md">
                    Change Cover
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
              </>
            ) : (
              <div className="p-8 text-center flex flex-col items-center">
                <svg className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <div className="mt-4 flex text-xs leading-6 text-zinc-600 dark:text-zinc-455 justify-center">
                  <label className="relative cursor-pointer rounded-[8px] font-bold text-[#D4AF37] hover:text-[#E0C55B] outline-none">
                    <span>Upload a cover photo file</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
                <p className="text-[10px] text-zinc-400 font-light mt-1">JPEG, PNG, or WEBP up to 10MB</p>
              </div>
            )}
          </div>
          {errors.coverImage && <p className="text-[11px] text-rose-500 mt-1">{errors.coverImage}</p>}
        </div>

        {/* Text inputs grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-[#262626] p-6 rounded-[20px] border border-zinc-200/50 dark:border-zinc-800/40">
          {/* Event Name */}
          <div className="flex flex-col space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#8E8E8E]">Event Name *</label>
            <input
              type="text"
              name="eventName"
              value={formData.eventName}
              onChange={handleInputChange}
              className={`rounded-[12px] border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-[#D4AF37] dark:border-zinc-800 dark:bg-[#181818] dark:text-zinc-100 dark:placeholder-zinc-650 ${
                errors.eventName ? "border-rose-500 focus:ring-rose-500" : ""
              }`}
              placeholder="E.g., Sophie & Daniel Wedding Ceremony"
            />
            {errors.eventName && <p className="text-[11px] text-rose-500">{errors.eventName}</p>}
          </div>

          {/* Bride Name */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#8E8E8E]">Bride Name (Optional)</label>
            <input
              type="text"
              name="brideName"
              value={formData.brideName}
              onChange={handleInputChange}
              className="rounded-[12px] border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-[#D4AF37] dark:border-zinc-800 dark:bg-[#181818] dark:text-zinc-100 dark:placeholder-zinc-650"
              placeholder="Sophie Carter"
            />
          </div>

          {/* Groom Name */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#8E8E8E]">Groom Name (Optional)</label>
            <input
              type="text"
              name="groomName"
              value={formData.groomName}
              onChange={handleInputChange}
              className="rounded-[12px] border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-[#D4AF37] dark:border-zinc-800 dark:bg-[#181818] dark:text-zinc-100 dark:placeholder-zinc-650"
              placeholder="Daniel Smith"
            />
          </div>

          {/* Event Date */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#8E8E8E]">Event Date (Optional)</label>
            <input
              type="date"
              name="eventDate"
              value={formData.eventDate}
              onChange={handleInputChange}
              onClick={(e) => {
                try {
                  e.target.showPicker();
                } catch (err) {}
              }}
              className="rounded-[12px] border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-[#D4AF37] dark:border-zinc-800 dark:bg-[#181818] dark:text-zinc-100"
            />
          </div>

          {/* Location */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#8E8E8E]">Location (Optional)</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="rounded-[12px] border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-[#D4AF37] dark:border-zinc-800 dark:bg-[#181818] dark:text-zinc-100 dark:placeholder-zinc-655"
              placeholder="Brooklyn, NY"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#8E8E8E]">Description / Client Memo (Optional)</label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              className="rounded-[12px] border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-[#D4AF37] dark:border-zinc-800 dark:bg-[#181818] dark:text-zinc-100 dark:placeholder-zinc-655 resize-none"
              placeholder="Add client gallery messages, high-resolution release information, etc."
            />
          </div>

          {/* Visibility Policy */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#8E8E8E]">Access Visibility</label>
            <select
              name="visibility"
              value={formData.visibility}
              onChange={handleInputChange}
              className="rounded-[12px] border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-900 outline-none focus:ring-2 focus:ring-[#D4AF37] dark:border-zinc-800 dark:bg-[#181818] dark:text-zinc-100"
            >
              <option value="public">Public (Anyone with link can view)</option>
              <option value="private">PIN Protected (Requires passcode to open)</option>
            </select>
          </div>

          {/* Passcode (Required if visibility is private) */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#8E8E8E]">
              Access Passcode / PIN {formData.visibility === "private" && "*"}
            </label>
            <input
              type="text"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              disabled={formData.visibility === "public"}
              className={`rounded-[12px] border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-[#D4AF37] dark:border-zinc-800 dark:bg-[#181818] dark:text-zinc-100 dark:placeholder-zinc-655 ${
                formData.visibility === "public" ? "opacity-40 bg-zinc-55 dark:bg-zinc-900/30 cursor-not-allowed" : ""
              } ${errors.password ? "border-rose-500 focus:ring-rose-500" : ""}`}
              placeholder={formData.visibility === "public" ? "Passcode disabled for public events" : "E.g., 5082"}
            />
            {errors.password && <p className="text-[11px] text-rose-500">{errors.password}</p>}
          </div>
        </div>

        {/* Action Panel buttons */}
        <div className="pt-6 border-t border-zinc-200/50 dark:border-zinc-800/40 flex items-center justify-end gap-3">
          <Link
            href="/dashboard/events"
            className="rounded-[12px] border border-zinc-250 bg-white px-5 py-2.5 text-xs font-bold text-zinc-650 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-[#262626] dark:text-zinc-350 dark:hover:bg-[#2D2D2D] transition-colors"
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
            {isSaving ? "Saving Changes..." : "Save Changes"}
          </button>
        </div>

      </form>

    </motion.div>
  );
}
