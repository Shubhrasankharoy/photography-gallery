import Link from "next/link";
import { getEventById } from "@/lib/eventService";
import { getGalleryPhotos } from "@/lib/galleryService";
import EventGalleryView from "@/components/EventGalleryView";

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
    title: `${event.eventName} - Workspace Gallery | CaptureSpace`,
    description: event.description || `Workspace proofing gallery for ${event.eventName}.`,
  };
}

export default async function EventGalleryPage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const eventId = resolvedParams.eventId;
  const clientPin = resolvedSearchParams.pin || "";

  const event = await getEventById(eventId);
  
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

  // 2. Render Passcode Authentication Screen (if private & incorrect password)
  if (!isPasswordCorrect) {
    return (
      <div className="flex min-h-[85vh] flex-col items-center justify-center bg-zinc-50 dark:bg-black px-4 transition-colors duration-300">
        
        <div className="mx-auto w-full max-w-md rounded-3xl border border-zinc-200/60 bg-white p-8 shadow-2xl dark:border-zinc-800/50 dark:bg-zinc-950/80">
          
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

  // Fetch photos for the unlocked event gallery
  let photos = [];
  try {
    photos = await getGalleryPhotos({ eventId });
  } catch (err) {
    console.error("Failed to load event photos for gallery workspace:", err);
  }

  return (
    <div className="w-full min-h-screen bg-zinc-50 dark:bg-black transition-colors duration-300">
      <EventGalleryView event={event} initialPhotos={photos} clientPin={clientPin} />
    </div>
  );
}
