"use client";

import { useState, useEffect } from "react";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => fetchUsers());
  }, []);

  async function toggleAdminRole(uid, currentIsAdmin) {
    setUpdatingId(uid);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, isAdmin: !currentIsAdmin }),
      });
      if (res.ok) {
        setUsers(users.map((u) => (u.uid === uid ? { ...u, isAdmin: !currentIsAdmin } : u)));
      }
    } catch (err) {
      console.error("Error toggling role:", err);
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteUser(uid) {
    if (!confirm("Are you sure you want to permanently delete this user? This action is irreversible.")) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/users?uid=${uid}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setUsers(users.filter((u) => u.uid !== uid));
      }
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  }

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    return (
      (u.displayName || "").toLowerCase().includes(term) ||
      (u.email || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 text-left">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Manage Users
          </h1>
          <p className="mt-2 text-sm text-zinc-650 dark:text-zinc-400 font-light">
            Grant/revoke administrative privileges, view status details, or remove user profiles.
          </p>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by name or email..."
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
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-850 dark:bg-zinc-950/20">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-850">
            <thead className="bg-zinc-50 dark:bg-zinc-900/40">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  User Info
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Joined Date
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-850">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-sm text-zinc-450 dark:text-zinc-550 italic font-light">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-150 text-zinc-700 font-bold text-sm dark:bg-zinc-900 dark:text-zinc-300">
                          {(u.displayName || u.email || "P").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate leading-tight">
                            {u.displayName || "Photographer"}
                          </span>
                          <span className="text-[11px] text-zinc-450 dark:text-zinc-500 truncate font-light leading-none mt-1">
                            {u.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400 font-light">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                          u.isAdmin
                            ? "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-950/20 dark:text-rose-400"
                            : "bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-600/10 dark:bg-zinc-900 dark:text-zinc-400"
                        }`}
                      >
                        {u.isAdmin ? "Administrator" : "Studio User"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3.5">
                        <button
                          onClick={() => toggleAdminRole(u.uid, u.isAdmin)}
                          disabled={updatingId === u.uid}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 disabled:opacity-50"
                        >
                          {u.isAdmin ? "Revoke Admin" : "Make Admin"}
                        </button>
                        <button
                          onClick={() => deleteUser(u.uid)}
                          className="text-xs font-bold text-rose-600 hover:text-rose-700"
                        >
                          Purge Account
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
