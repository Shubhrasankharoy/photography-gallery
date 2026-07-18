"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ManagePhotographers() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadPhotographers() {
      try {
        if (!db) return;
        const querySnapshot = await getDocs(collection(db, "photographers"));
        const data = [];
        querySnapshot.forEach((doc) => {
          data.push({ uid: doc.id, ...doc.data() });
        });
        setProfiles(data);
      } catch (err) {
        console.error("Error loading profiles:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPhotographers();
  }, []);

  const filtered = profiles.filter((p) => {
    const term = search.toLowerCase();
    return (
      (p.studioName || "").toLowerCase().includes(term) ||
      (p.location || "").toLowerCase().includes(term) ||
      (p.fullName || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 text-left">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Manage Photographers
          </h1>
          <p className="mt-2 text-sm text-zinc-650 dark:text-zinc-400 font-light">
            Audit photography profile credentials, studio branding configurations, and locations.
          </p>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by studio, name or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-250 bg-white px-4 py-2.5 text-sm outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-600 border-t-transparent dark:border-rose-450"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.length === 0 ? (
            <div className="col-span-full py-12 text-center text-sm text-zinc-450 dark:text-zinc-555 italic font-light">
              No photographer studio profiles matching search criteria.
            </div>
          ) : (
            filtered.map((p) => (
              <div
                key={p.uid}
                className="relative flex flex-col justify-between rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-850 dark:bg-zinc-950/20"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-zinc-850">
                      {p.logoUrl ? (
                        <img src={p.logoUrl} alt="Logo" className="h-full w-full object-cover" />
                      ) : (
                        <span className="font-bold text-zinc-650 dark:text-zinc-350 uppercase">
                          {p.studioName?.charAt(0) || "S"}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-150 truncate leading-tight">
                        {p.studioName || "Unnamed Studio"}
                      </h3>
                      <span className="text-[10px] text-zinc-450 truncate font-light mt-0.5 leading-none">
                        Owner: {p.fullName || "Unspecified"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2 text-xs font-light text-zinc-600 dark:text-zinc-400">
                    <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-900 pb-1">
                      <span>Location:</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{p.location || "Worldwide"}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-900 pb-1">
                      <span>Website:</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-44">{p.website || "None"}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-150 dark:border-zinc-900 flex gap-4">
                  <a
                    href={`/photographer/${p.uid}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex flex-1 items-center justify-center rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 py-2.5 text-xs font-bold text-zinc-850 dark:text-zinc-250 transition-all text-center"
                  >
                    View Studio Page
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
