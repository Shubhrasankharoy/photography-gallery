"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export default function StorageOverview() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quotaLimit, setQuotaLimit] = useState(5); // 5GB limit default

  useEffect(() => {
    async function loadStorageDetails() {
      try {
        if (!db) return;
        const [usersSnap, photosSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "photos")),
        ]);

        const photosList = [];
        photosSnap.forEach((doc) => {
          photosList.push(doc.data());
        });

        const usersList = [];
        usersSnap.forEach((doc) => {
          const u = doc.data();
          const userPhotos = photosList.filter((p) => p.photographerId === doc.id);
          const bytesUsed = userPhotos.reduce((sum, p) => sum + (p.size || 0), 0);
          usersList.push({
            uid: doc.id,
            displayName: u.displayName || "Photographer",
            email: u.email,
            bytesUsed,
            photoCount: userPhotos.length,
          });
        });

        usersList.sort((a, b) => b.bytesUsed - a.bytesUsed);
        setUsers(usersList);
      } catch (err) {
        console.error("Error loading storage metrics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStorageDetails();
  }, []);

  const totalBytes = users.reduce((sum, u) => sum + u.bytesUsed, 0);
  const quotaLimitBytes = quotaLimit * 1024 * 1024 * 1024;
  const overallPercentage = Math.min((totalBytes / quotaLimitBytes) * 100, 100);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 text-left">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Storage Diagnostics
        </h1>
        <p className="mt-2 text-sm text-zinc-650 dark:text-zinc-400 font-light">
          Monitor database media allocation, active studio consumption rates, and adjust platform limits.
        </p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-600 border-t-transparent dark:border-rose-450"></div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-white dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-850 rounded-3xl p-6 shadow-xs">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Cumulative Cloud Quota Allocation</h3>
            <div className="mt-4 flex items-center justify-between text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
              <span>Overall Consumption: {formatBytes(totalBytes)}</span>
              <span>Overall Quota Limit: {quotaLimit} GB</span>
            </div>
            <div className="w-full h-3 rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
              <div
                className="h-full bg-rose-605 bg-rose-600 transition-all duration-500"
                style={{ width: `${overallPercentage}%` }}
              />
            </div>
            <span className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-2 block">
              Used {overallPercentage.toFixed(2)}% of the total system storage capacity.
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-850 dark:bg-zinc-950/20">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-850">
              <thead className="bg-zinc-50 dark:bg-zinc-900/40">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    Studio User
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    Asset Count
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    Storage Consumed
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    Quota Allocation
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-850">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-sm text-zinc-450 dark:text-zinc-555 italic font-light">
                      No registered storage consumption logs.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const maxUserLimit = 5 * 1024 * 1024 * 1024; // 5GB limit per user
                    const userPercent = Math.min((u.bytesUsed / maxUserLimit) * 100, 100);
                    return (
                      <tr key={u.uid} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-all">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{u.displayName}</span>
                            <span className="text-[10px] text-zinc-450 dark:text-zinc-500 font-light mt-0.5">{u.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-650 dark:text-zinc-400 font-light">
                          {u.photoCount} files
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                          {formatBytes(u.bytesUsed)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-2 rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                              <div
                                className="h-full bg-rose-600"
                                style={{ width: `${userPercent}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                              {userPercent.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
