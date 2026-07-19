import Link from "next/link";
import { getEventById } from "@/lib/eventService";
import { getPhotosByEvent } from "@/lib/photoService";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const eventId = resolvedParams.eventId;
  const event = await getEventById(eventId);
  
  if (!event) {
    return {
      title: "Event Gallery Not Found | CaptureSpace",
      description: "The requested proofing gallery could not be located.",
    };
  }

  return {
    title: `${event.eventName} | Guest Access | CaptureSpace`,
    description: event.description || `Secure proofing space for client event ${event.eventName}.`,
  };
}

export default async function EventGuestView({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const eventId = resolvedParams.eventId;
  const clientPin = resolvedSearchParams.pin || "";

  const event = await getEventById(eventId);
  
  // Fetch photos, studio branding details, and creator profile concurrently
  let photos = [];
  let studio = null;
  let creatorName = "";

  if (event) {
    try {
      const fetches = [];
      
      // 1. Fetch photos
      fetches.push(getPhotosByEvent(eventId).catch(err => {
        console.error("Failed to load event photos:", err);
        return [];
      }));

      // 2. Fetch studio details if exists
      if (event.studioId) {
        const { getStudioById } = await import("@/lib/studioService");
        fetches.push(getStudioById(event.studioId).catch(err => {
          console.error("Failed to load studio details:", err);
          return null;
        }));
      } else {
        fetches.push(Promise.resolve(null));
      }

      // 3. Fetch creator profile info
      const creatorUid = event.createdBy || event.photographerId;
      if (creatorUid) {
        const { getProfileByUid } = await import("@/lib/profileService");
        fetches.push(getProfileByUid(creatorUid).catch(err => {
          console.error("Failed to load creator profile:", err);
          return null;
        }));
      } else {
        fetches.push(Promise.resolve(null));
      }

      const [resolvedPhotos, resolvedStudio, resolvedCreator] = await Promise.all(fetches);
      photos = resolvedPhotos || [];
      studio = resolvedStudio;
      creatorName = resolvedCreator?.displayName || resolvedCreator?.name || "Member";
    } catch (err) {
      console.error("Failed loading event page data concurrently:", err);
    }
  }

  // 1. Event Space Not Found
  if (!event) {
    return (
      <div className="flex min-h-[85vh] flex-col items-center justify-center bg-white px-4 text-center dark:bg-black transition-colors duration-300">
        <div className="relative mb-6">
          <div className="h-24 w-24 rounded-full bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-500">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">Gallery Space Not Found</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 font-light max-w-sm leading-relaxed">
          The requested event gallery could not be located. It may have been archived or deleted by the photographer.
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="rounded-full bg-zinc-950 px-6 py-3 text-xs font-bold text-white hover:bg-zinc-850 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200 transition-all"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const isPrivate = event.visibility === "private";
  const isPasswordCorrect = !isPrivate || (clientPin === event.password);
  const wrongPasswordEntered = isPrivate && clientPin !== "" && clientPin !== event.password;

  // 2. Render Passcode Authentication Screen
  if (!isPasswordCorrect) {
    return (
      <div className="flex min-h-[85vh] flex-col items-center justify-center bg-zinc-50 dark:bg-black px-4 transition-colors duration-300">
        
        <div className="mx-auto w-full max-w-md rounded-3xl border border-zinc-200/60 bg-white p-8 shadow-2xl dark:border-zinc-800/50 dark:bg-zinc-950/80">
          
          {/* Padlock Icon */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>

          <h2 className="mt-5 text-center text-xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Passcode Protected Space
          </h2>
          <p className="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400 font-light leading-relaxed">
            Enter the access PIN provided by your photographer to view the private client gallery of <span className="font-semibold text-zinc-800 dark:text-zinc-200">{event.eventName}</span>.
          </p>

          {/* Wrong Password Screen banner */}
          {wrongPasswordEntered && (
            <div className="mt-5 rounded-2xl bg-rose-50 border border-rose-200/80 p-4 dark:bg-rose-950/20 dark:border-rose-900/50 flex items-start gap-3 animate-fade-in text-left">
              <svg className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-rose-800 dark:text-rose-300">Invalid Passcode</p>
                <p className="text-[10px] text-rose-700 dark:text-rose-400 font-light mt-0.5 leading-relaxed">
                  The access code entered is incorrect. Verify the PIN with your photographer.
                </p>
              </div>
            </div>
          )}

          {/* Native GET form to submit query pin */}
          <form method="GET" className="mt-6 space-y-4">
            <div className="flex flex-col space-y-1.5 text-left">
              <label htmlFor="pin-input" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">PIN Code</label>
              <input
                id="pin-input"
                type="text"
                name="pin"
                required
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:ring-indigo-400 transition-all text-center tracking-widest font-bold"
                placeholder="E.g., 5082"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center rounded-xl bg-indigo-650 hover:bg-indigo-600 py-3.5 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all"
            >
              Verify & Unlock
            </button>
          </form>

        </div>

      </div>
    );
  }

  // 3. Render Guest View (Unlocked / Public)
  const coverImage = event.coverImage || "https://images.unsplash.com/photo-1452587925148-ce544e77e60d?q=80&w=1200&auto=format&fit=crop";

  return (
    <div className="w-full min-h-screen bg-white dark:bg-black transition-colors duration-300">
      
      {/* Panoramic Cover Header */}
      <div className="relative h-[45vh] w-full bg-zinc-900 overflow-hidden">
        <img
          src={coverImage}
          alt={`${event.eventName} cover`}
          className="h-full w-full object-cover object-center filter brightness-75 scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-white via-transparent to-black/20 dark:from-black" />
      </div>

      {/* Main Profile Showcase */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 pb-20">
        
        {/* Profile Card Container */}
        <div className="rounded-3xl border border-zinc-200/60 bg-white/90 p-6 sm:p-10 shadow-2xl backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-950/80 transition-all duration-300">
          
          {/* Header information */}
          <div className="flex flex-col gap-4 pb-6 border-b border-zinc-200/60 dark:border-zinc-800/50 text-left">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
              {event.eventName}
            </h1>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-500 dark:text-zinc-400 font-light">
              {event.eventDate && (
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-indigo-650 dark:text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{event.eventDate}</span>
                </span>
              )}

              {event.location && (
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-indigo-650 dark:text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{event.location}</span>
                </span>
              )}

              {event.visibility === "private" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Secure Access Mode
                </span>
              )}
            </div>
          </div>

          {/* Details / Couples Column */}
          <div className="mt-6 flex flex-col md:flex-row md:items-start justify-between gap-6 text-left">
            <div className="grow space-y-4 max-w-2xl">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">Event Details</h3>
              <p className="text-zinc-600 dark:text-zinc-300 font-light text-sm leading-relaxed whitespace-pre-line">
                {event.description || "Welcome to the custom proofing workspace folder. High-resolution photographs will be visible here for review shortly."}
              </p>
            </div>

            {/* Sidebar Cards */}
            <div className="w-full md:w-72 shrink-0 space-y-4">
              {(event.brideName || event.groomName) && (
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-950/40">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Celebrated Couple</h4>
                  <div className="mt-2 text-sm font-bold text-zinc-800 dark:text-zinc-200 space-y-1">
                    {event.brideName && <div className="flex items-center gap-2">👰 {event.brideName}</div>}
                    {event.groomName && <div className="flex items-center gap-2">🤵 {event.groomName}</div>}
                  </div>
                </div>
              )}

              {(studio || creatorName) && (
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-950/40 space-y-4">
                  {studio && (
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Published By</h4>
                      <Link 
                        href={`/studio/${studio.studioSlug}`}
                        className="mt-1.5 flex items-center gap-2 group"
                      >
                        {studio.logo ? (
                          <img src={studio.logo} alt={studio.studioName} className="h-6 w-6 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center text-[10px] font-bold text-indigo-650 dark:text-indigo-400 shrink-0">
                            {studio.studioName.charAt(0)}
                          </div>
                        )}
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                          {studio.studioName}
                        </span>
                      </Link>
                    </div>
                  )}
                  {creatorName && (
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Created By</h4>
                      <div className="mt-1 text-xs font-bold text-zinc-800 dark:text-zinc-250">
                        {creatorName}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Masonry / Photo grid */}
          <div className="mt-12 pt-8 border-t border-zinc-200/60 dark:border-zinc-800/50 text-left">
            {photos && photos.length > 0 ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Event Gallery ({photos.length} photos)</h3>
                  <Link
                    href={`/event/${eventId}/gallery${clientPin ? `?pin=${clientPin}` : ""}`}
                    className="rounded-full bg-indigo-600 hover:bg-indigo-700 px-5 py-2 text-xs font-bold text-white transition-all shadow-md hover:shadow-lg flex items-center gap-1.5"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    Open Workspace Gallery
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {photos.map((photo) => (
                    <div
                      key={photo.photoId}
                      className="group relative overflow-hidden rounded-xl border border-zinc-200/60 dark:border-zinc-800/50 bg-zinc-100 dark:bg-zinc-900 shadow-sm hover:shadow-lg transition-all"
                    >
                      <div className="relative aspect-square w-full overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                        <img
                          src={photo.thumbnailUrl || photo.url}
                          alt={photo.name}
                          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <p className="text-xs font-semibold text-white truncate">{photo.name}</p>
                        <p className="text-[10px] text-zinc-300 mt-1">Click to download</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-200 p-16 dark:border-zinc-800 bg-zinc-50/20 dark:bg-transparent text-center">
                <svg className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
                <h4 className="mt-4 text-sm font-bold text-zinc-800 dark:text-zinc-200">Event Gallery is Empty</h4>
                <p className="mt-1.5 text-xs text-zinc-500 font-light max-w-xs mx-auto">
                  No client proofing photos have been uploaded to this space yet. Please contact the studio for updates.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
