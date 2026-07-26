import Link from "next/link";
import { getStudioBySlug } from "@/lib/studioService";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const studio = await getStudioBySlug(slug);
  
  if (!studio) {
    return {
      title: "Studio Not Found | CaptureSpace",
      description: "The requested brand studio space could not be located.",
    };
  }

  return {
    title: `${studio.studioName} | Professional Photography | CaptureSpace`,
    description: studio.description || `Browse portfolio highlights and proofing spaces from ${studio.studioName}.`,
  };
}

export default async function PublicStudioProfile({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const studio = await getStudioBySlug(slug);

  // Studio not found view
  if (!studio) {
    return (
      <div className="flex min-h-[85vh] flex-col items-center justify-center bg-[#F7F7F7] px-4 text-center dark:bg-[#181818] transition-colors duration-300">
        <div className="relative mb-6">
          <div className="h-24 w-24 rounded-full bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-500">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 font-headline">Studio Workspace Not Found</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 font-light max-w-sm leading-relaxed">
          The studio address <span className="font-semibold text-zinc-800 dark:text-zinc-200">&quot;{slug}&quot;</span> does not exist or has not been published yet.
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="rounded-[12px] bg-[#D4AF37] px-6 py-3 text-xs font-bold text-[#181818] hover:bg-[#E0C55B] transition-all"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // Fallbacks for empty images
  const coverUrl = studio.coverImage || "https://images.unsplash.com/photo-1452587925148-ce544e77e60d?q=80&w=1200&auto=format&fit=crop";
  const logoUrl = studio.logo || "";

  return (
    <div className="w-full min-h-screen bg-[#F7F7F7] dark:bg-[#181818] transition-colors duration-300">
      
      {/* Panoramic Cover Header */}
      <div className="relative h-[45vh] w-full bg-zinc-900 overflow-hidden">
        <img
          src={coverUrl}
          alt={`${studio.studioName} cover`}
          className="h-full w-full object-cover object-center filter brightness-75 scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#F7F7F7] via-transparent to-black/20 dark:from-[#181818]" />
      </div>

      {/* Main Profile Showcase */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 pb-20">
        
        {/* Profile Card Container */}
        <div className="rounded-[24px] border border-zinc-200/50 bg-white/95 p-6 sm:p-10 shadow-[var(--shadow-soft)] backdrop-blur-md dark:border-zinc-800/40 dark:bg-[#202020]/95 transition-all duration-300">
          
          {/* Logo & Headline Row */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-zinc-200/50 dark:border-zinc-800/40">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
              {/* Logo / Initial Box */}
              <div className="h-28 w-28 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] border-4 border-white shadow-xl dark:border-[#202020] overflow-hidden shrink-0 flex items-center justify-center text-3xl font-extrabold select-none">
                {logoUrl ? (
                   <img src={logoUrl} alt={`${studio.studioName} logo`} className="h-full w-full object-cover" />
                ) : (
                  studio.studioName.charAt(0).toUpperCase()
                )}
              </div>

              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight font-headline">
                  {studio.studioName}
                </h1>
                <p className="mt-1.5 text-base text-zinc-550 dark:text-zinc-400 font-light flex items-center justify-center sm:justify-start gap-2">
                  <span className="font-bold text-[#D4AF37]">Creative Studio Workspace</span>
                  {(studio.visibilitySettings?.showLocation !== false) && studio.location && (
                    <>
                      <span className="text-zinc-300 dark:text-zinc-700">|</span>
                      <span>{studio.location}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Social Icons row */}
            {(studio.visibilitySettings?.showSocials !== false) && (
              <div className="flex justify-center items-center gap-3">
                {studio.website && (
                  <a
                    href={studio.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-zinc-200/60 p-2.5 text-zinc-400 hover:text-[#D4AF37] dark:border-zinc-800/40 dark:text-zinc-500 dark:hover:text-[#D4AF37] hover:bg-zinc-100 dark:hover:bg-[#2D2D2D] transition-all"
                    title="Website"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </a>
                )}

                {studio.instagram && (
                  <a
                    href={`https://instagram.com/${studio.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-zinc-200/60 p-2.5 text-zinc-400 hover:text-[#D4AF37] dark:border-zinc-800/40 dark:text-zinc-500 dark:hover:text-[#D4AF37] hover:bg-zinc-100 dark:hover:bg-[#2D2D2D] transition-all"
                    title="Instagram"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01" />
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="currentColor" strokeWidth="2" fill="none" />
                    </svg>
                  </a>
                )}

                {studio.facebook && (
                  <a
                    href={studio.facebook.startsWith("http") ? studio.facebook : `https://facebook.com/${studio.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-zinc-200/60 p-2.5 text-zinc-400 hover:text-[#D4AF37] dark:border-zinc-800/40 dark:text-zinc-500 dark:hover:text-[#D4AF37] hover:bg-zinc-100 dark:hover:bg-[#2D2D2D] transition-all"
                    title="Facebook"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Bio & Details Grid */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Bio Column */}
            <div className={
              ((studio.visibilitySettings?.showEmail !== false && studio.email) || 
               (studio.visibilitySettings?.showPhone !== false && studio.phone) || 
               (studio.visibilitySettings?.showLocation !== false && studio.location)) 
                ? "lg:col-span-7 flex flex-col space-y-4 text-left" 
                : "lg:col-span-12 flex flex-col space-y-4 text-left"
            }>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 font-headline">About the Studio</h2>
              <p className="text-zinc-650 dark:text-zinc-300 font-light text-base leading-relaxed whitespace-pre-line">
                {studio.description || "No biography provided. Capturing elegance and storytelling through professional photography lenses."}
              </p>
            </div>

            {/* Contact details Card Column */}
            {((studio.visibilitySettings?.showEmail !== false && studio.email) || 
              (studio.visibilitySettings?.showPhone !== false && studio.phone) || 
              (studio.visibilitySettings?.showLocation !== false && studio.location)) && (
              <div className="lg:col-span-5">
                <div className="rounded-[20px] border border-zinc-200/50 bg-zinc-50/50 p-6 dark:border-zinc-800/40 dark:bg-[#262626]/40 text-left">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider mb-4 font-headline">Contact Studio</h3>
                  
                  <div className="space-y-4 text-sm font-medium">
                    {studio.visibilitySettings?.showEmail !== false && studio.email && (
                      <div className="flex items-start gap-3">
                        <svg className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <a href={`mailto:${studio.email}`} className="text-zinc-700 hover:text-[#D4AF37] dark:text-zinc-300 dark:hover:text-[#D4AF37] break-all">
                          {studio.email}
                        </a>
                      </div>
                    )}

                    {studio.visibilitySettings?.showPhone !== false && studio.phone && (
                      <div className="flex items-start gap-3">
                        <svg className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="text-zinc-700 dark:text-zinc-300">{studio.phone}</span>
                      </div>
                    )}

                    {studio.visibilitySettings?.showLocation !== false && studio.location && (
                      <div className="flex items-start gap-3">
                        <svg className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-zinc-700 dark:text-zinc-300">{studio.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Team Members Section */}
        {studio.visibilitySettings?.showMembers !== false && studio.members && studio.members.length > 0 && (
          <div className="mt-16 text-left">
            <h2 className="text-2xl font-bold font-headline text-zinc-900 dark:text-zinc-50 tracking-tight mb-8">
              Our Creative Team
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {studio.members.map((member) => (
                <div 
                  key={member.userId}
                  className="rounded-[20px] border border-zinc-200/50 bg-white/95 p-5 dark:border-zinc-800/40 dark:bg-[#262626] flex items-center gap-4 transition-all duration-300 hover:scale-[1.02] shadow-[var(--shadow-soft)]"
                >
                  <div className="h-12 w-12 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] text-sm font-extrabold select-none shrink-0">
                    {member.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 font-headline leading-tight">
                      {member.displayName}
                    </h3>
                    <p className="text-[11px] text-[#D4AF37] font-semibold tracking-wide uppercase mt-0.5">
                      {member.position || (member.role ? member.role.charAt(0).toUpperCase() + member.role.slice(1) : "Team Member")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Events / Galleries Section */}
        {studio.visibilitySettings?.showEvents !== false && studio.events && studio.events.length > 0 && (
          <div className="mt-16 text-left">
            <h2 className="text-2xl font-bold font-headline text-zinc-900 dark:text-zinc-50 tracking-tight mb-8">
              Studio Galleries & Events
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {studio.events.map((event) => {
                const isPrivate = event.visibility === "private";
                return (
                  <Link
                    href={`/event/${event.eventId}`}
                    key={event.eventId}
                    className="group flex flex-col overflow-hidden rounded-[20px] border border-zinc-200/50 bg-white dark:border-zinc-800/40 dark:bg-[#262626] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    {/* Cover Photo */}
                    <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                      {event.coverImage ? (
                        <img
                          src={event.coverImage}
                          alt={event.eventName}
                          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 text-zinc-400">
                          <svg className="h-8 w-8 stroke-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                          </svg>
                        </div>
                      )}

                      {/* Visibility Overlay */}
                      <span className={`absolute top-3 left-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-wider uppercase backdrop-blur-md border ${
                        isPrivate 
                          ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      }`}>
                        {isPrivate ? "Private" : "Public"}
                      </span>
                    </div>

                    {/* Text Details */}
                    <div className="p-5 flex flex-col flex-1 text-left">
                      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 font-headline line-clamp-1 group-hover:text-[#D4AF37] transition-colors">
                        {event.eventName}
                      </h3>
                      
                      <div className="space-y-1.5 text-xs text-zinc-550 dark:text-zinc-400 font-light mt-3 flex-1">
                        {(event.brideName || event.groomName) && (
                          <p className="flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300">
                            {event.brideName && event.groomName
                              ? `${event.brideName} & ${event.groomName}`
                              : event.brideName || event.groomName}
                          </p>
                        )}
                        {event.location && (
                          <p className="flex items-center gap-1.5">
                            <span>{event.location}</span>
                          </p>
                        )}
                        {event.eventDate && (
                          <p className="text-[10px] text-[#8E8E8E] font-light mt-1">
                            {new Date(event.eventDate).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric"
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
