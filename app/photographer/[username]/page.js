import Link from "next/link";
import { getProfileByUsername } from "@/lib/profileService";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const username = resolvedParams.username;
  const profile = await getProfileByUsername(username);
  
  if (!profile) {
    return {
      title: "Photographer Not Found | CaptureSpace",
      description: "The requested photographer workspace could not be located.",
    };
  }

  return {
    title: `${profile.studioName} | Professional Gallery | CaptureSpace`,
    description: profile.bio || `Browse portfolios, client events, and high-resolution delivery galleries by ${profile.photographerName}.`,
  };
}

export default async function PublicProfile({ params }) {
  const resolvedParams = await params;
  const username = resolvedParams.username;
  const profile = await getProfileByUsername(username);

  // Profile not found view
  if (!profile) {
    return (
      <div className="flex min-h-[85vh] flex-col items-center justify-center bg-white px-4 text-center dark:bg-black transition-colors duration-300">
        <div className="relative mb-6">
          <div className="h-24 w-24 rounded-full bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-500">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">Profile Not Found</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 font-light max-w-sm leading-relaxed">
          The photographer username <span className="font-semibold text-zinc-800 dark:text-zinc-200">&quot;{username}&quot;</span> does not exist or has not published their space yet.
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

  // Fallbacks for empty images
  const coverUrl = profile.coverImage || "https://images.unsplash.com/photo-1452587925148-ce544e77e60d?q=80&w=1200&auto=format&fit=crop";
  const logoUrl = profile.logo || "";

  return (
    <div className="w-full min-h-screen bg-white dark:bg-black transition-colors duration-300">
      
      {/* Panoramic Cover Header */}
      <div className="relative h-[45vh] w-full bg-zinc-900 overflow-hidden">
        <img
          src={coverUrl}
          alt={`${profile.studioName} cover`}
          className="h-full w-full object-cover object-center filter brightness-75 scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-white via-transparent to-black/20 dark:from-black" />
      </div>

      {/* Main Profile Showcase */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 pb-20">
        
        {/* Profile Card Container */}
        <div className="rounded-3xl border border-zinc-200/60 bg-white/90 p-6 sm:p-10 shadow-2xl backdrop-blur-md dark:border-zinc-850/50 dark:bg-zinc-950/80 transition-all duration-300">
          
          {/* Logo & Headline Row */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-zinc-200/60 dark:border-zinc-850/50">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
              {/* Logo / Initial Box */}
              <div className="h-28 w-28 rounded-full bg-indigo-600 border-4 border-white shadow-xl dark:border-zinc-950 overflow-hidden shrink-0 flex items-center justify-center text-white text-3xl font-extrabold select-none">
                {logoUrl ? (
                  <img src={logoUrl} alt={`${profile.studioName} logo`} className="h-full w-full object-cover" />
                ) : (
                  profile.studioName.charAt(0).toUpperCase()
                )}
              </div>

              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
                  {profile.studioName}
                </h1>
                <p className="mt-1.5 text-base text-zinc-550 dark:text-zinc-400 font-light flex items-center justify-center sm:justify-start gap-2">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">{profile.photographerName}</span>
                  {profile.location && (
                    <>
                      <span className="text-zinc-300 dark:text-zinc-700">|</span>
                      <span>{profile.location}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Social Icons row */}
            <div className="flex justify-center items-center gap-3">
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-zinc-250 p-2.5 text-zinc-650 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 transition-all"
                  title="Website"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </a>
              )}

              {profile.instagram && (
                <a
                  href={`https://instagram.com/${profile.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-zinc-250 p-2.5 text-zinc-650 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 transition-all"
                  title="Instagram"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01" />
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="currentColor" strokeWidth="2" fill="none" />
                  </svg>
                </a>
              )}

              {profile.facebook && (
                <a
                  href={profile.facebook.startsWith("http") ? profile.facebook : `https://facebook.com/${profile.facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-zinc-250 p-2.5 text-zinc-650 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 transition-all"
                  title="Facebook"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* Bio & Details Grid */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Bio Column (span 7) */}
            <div className="lg:col-span-7 flex flex-col space-y-4">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">About the Studio</h2>
              <p className="text-zinc-650 dark:text-zinc-300 font-light text-base leading-relaxed whitespace-pre-line">
                {profile.bio || "No biography provided. Capturing elegance and storytelling through professional photography lenses."}
              </p>
            </div>

            {/* Contact details Card Column (span 5) */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-6 dark:border-zinc-850/50 dark:bg-zinc-950/40">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider mb-4">Contact Workspace</h3>
                
                <div className="space-y-4 text-sm font-medium">
                  {/* Email */}
                  {profile.email && (
                    <div className="flex items-start gap-3">
                      <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <a href={`mailto:${profile.email}`} className="text-zinc-700 hover:text-indigo-600 dark:text-zinc-300 dark:hover:text-indigo-400 break-all">
                        {profile.email}
                      </a>
                    </div>
                  )}

                  {/* Phone */}
                  {profile.phone && (
                    <div className="flex items-start gap-3">
                      <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="text-zinc-700 dark:text-zinc-300">{profile.phone}</span>
                    </div>
                  )}

                  {/* Location */}
                  {profile.location && (
                    <div className="flex items-start gap-3">
                      <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-zinc-700 dark:text-zinc-300">{profile.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Placeholder Galleries section */}
          <div className="mt-12 pt-8 border-t border-zinc-200/60 dark:border-zinc-850/50">
            <h3 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 mb-6">Client Proofing Spaces</h3>
            
            <div className="rounded-2xl border border-dashed border-zinc-200 p-10 text-center dark:border-zinc-800 bg-zinc-50/20 dark:bg-transparent">
              <svg className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-750" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375 .375 0 11-.75 0 .375 .375 0 017 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375 .375 0 11-.75 0 .375 .375 0 017 0zM3.75 17.25h.007v.008H3.75v-.008zm.375 0a.375 .375 0 11-.75 0 .375 .375 0 017 0z" />
              </svg>
              <h4 className="mt-4 text-sm font-bold text-zinc-800 dark:text-zinc-200">No Public Spaces Listed</h4>
              <p className="mt-1.5 text-xs text-zinc-500 font-light max-w-xs mx-auto">
                This photographer hasn&apos;t published any client proofing galleries yet. Please check back later.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
