"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { 
  getUserStudios, 
  getStudioMembers, 
  getStudioInvitations, 
  inviteMember, 
  cancelInvitation, 
  getPendingInvitations, 
  acceptInvitation, 
  rejectInvitation,
  removeStudioMember,
  updateMemberRole,
  transferStudioOwnership
} from "@/lib/studioService";

export default function StudioHub() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [studios, setStudios] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  
  // Incoming invites to the current user
  const [incomingInvites, setIncomingInvites] = useState([]);
  const [isFetchingInvites, setIsFetchingInvites] = useState(true);

  // Tab management inside studio view
  const [activeTab, setActiveTab] = useState("overview"); // overview, members

  // Studio management states
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Invite member form state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("photographer");
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);

  // General error/success messages
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Redirect if unauthenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  // Load user studios and incoming invitations
  const loadInitialData = useCallback(async () => {
    if (!user) return;
    try {
      setIsFetching(true);
      setIsFetchingInvites(true);
      
      const userStudios = await getUserStudios(user.uid);
      setStudios(userStudios);

      // Load pending invites sent to this user's email
      if (user.email) {
        const invites = await getPendingInvitations(user.email);
        setIncomingInvites(invites);
      }
    } catch (err) {
      console.error("Failed to load initial data:", err);
    } finally {
      setIsFetching(false);
      setIsFetchingInvites(false);
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    async function run() {
      await Promise.resolve();
      if (active && user) {
        loadInitialData();
      }
    }
    run();
    return () => {
      active = false;
    };
  }, [user, loadInitialData]);

  // Load studio members & invitations if user is in a studio
  const loadStudioDetails = useCallback(async () => {
    if (studios.length === 0) return;
    const currentStudio = studios[0];
    try {
      setLoadingMembers(true);
      const memberList = await getStudioMembers(currentStudio.studioId);
      setMembers(memberList);

      // Retrieve sent invitations if owner/admin
      if (currentStudio.userRole === "owner" || currentStudio.userRole === "admin") {
        const inviteList = await getStudioInvitations(currentStudio.studioId);
        setInvitations(inviteList);
      }
    } catch (err) {
      console.error("Failed to load members or invitations:", err);
    } finally {
      setLoadingMembers(false);
    }
  }, [studios]);

  useEffect(() => {
    let active = true;
    async function run() {
      await Promise.resolve();
      if (active && studios.length > 0) {
        loadStudioDetails();
      }
    }
    run();
    return () => {
      active = false;
    };
  }, [studios, activeTab, loadStudioDetails]);

  // Handle invitation responses
  const handleAcceptInvite = async (inviteId) => {
    try {
      setActionError("");
      setActionSuccess("");
      await acceptInvitation(inviteId, user.uid);
      setActionSuccess("Invitation accepted successfully!");
      // Reload studio listing & invites
      await loadInitialData();
    } catch (err) {
      console.error("Failed to accept invite:", err);
      setActionError(err.message || "Failed to accept invite.");
    }
  };

  const handleRejectInvite = async (inviteId) => {
    try {
      setActionError("");
      setActionSuccess("");
      await rejectInvitation(inviteId);
      setActionSuccess("Invitation declined.");
      // Reload invites
      if (user.email) {
        const invites = await getPendingInvitations(user.email);
        setIncomingInvites(invites);
      }
    } catch (err) {
      console.error("Failed to reject invite:", err);
      setActionError(err.message || "Failed to decline invite.");
    }
  };

  // Sent invites
  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (studios.length === 0) return;
    const currentStudio = studios[0];

    if (!inviteEmail.trim()) {
      setInviteError("Email is required.");
      return;
    }

    setSendingInvite(true);
    setInviteError("");
    setInviteSuccess("");

    try {
      await inviteMember(currentStudio.studioId, inviteEmail, inviteRole, user.uid);
      setInviteSuccess(`Successfully sent invite to ${inviteEmail}.`);
      setInviteEmail("");
      // Reload sent invites
      const inviteList = await getStudioInvitations(currentStudio.studioId);
      setInvitations(inviteList);
    } catch (err) {
      console.error("Failed to send invite:", err);
      setInviteError(err.message || "Failed to invite member.");
    } finally {
      setSendingInvite(false);
    }
  };

  const handleCancelInvite = async (inviteId) => {
    if (!confirm("Are you sure you want to cancel this invitation?")) return;
    if (studios.length === 0) return;
    const currentStudio = studios[0];

    try {
      setActionError("");
      await cancelInvitation(inviteId);
      // Reload sent invites
      const inviteList = await getStudioInvitations(currentStudio.studioId);
      setInvitations(inviteList);
    } catch (err) {
      console.error("Failed to cancel invite:", err);
      setActionError("Failed to cancel invitation.");
    }
  };

  // Member role updates
  const handlePromote = async (member) => {
    if (studios.length === 0) return;
    const currentStudio = studios[0];
    const nextRole = member.role === "viewer" ? "photographer" : "admin";

    try {
      setActionError("");
      await updateMemberRole(currentStudio.studioId, member.userId, nextRole);
      await loadStudioDetails();
    } catch (err) {
      console.error(err);
      setActionError("Failed to promote member.");
    }
  };

  const handleDemote = async (member) => {
    if (studios.length === 0) return;
    const currentStudio = studios[0];
    const nextRole = member.role === "admin" ? "photographer" : "viewer";

    try {
      setActionError("");
      await updateMemberRole(currentStudio.studioId, member.userId, nextRole);
      await loadStudioDetails();
    } catch (err) {
      console.error(err);
      setActionError("Failed to demote member.");
    }
  };

  const handleRemoveMember = async (member) => {
    if (!confirm(`Are you sure you want to remove ${member.displayName} from the studio?`)) return;
    if (studios.length === 0) return;
    const currentStudio = studios[0];

    try {
      setActionError("");
      await removeStudioMember(currentStudio.studioId, member.userId);
      await loadStudioDetails();
    } catch (err) {
      console.error(err);
      setActionError("Failed to remove member.");
    }
  };

  const handleTransferOwnership = async (member) => {
    if (!confirm(`Are you sure you want to transfer ownership to ${member.displayName}? You will be demoted to Admin.`)) return;
    if (studios.length === 0) return;
    const currentStudio = studios[0];

    try {
      setActionError("");
      await transferStudioOwnership(currentStudio.studioId, user.uid, member.userId);
      // Reload studio info
      await loadInitialData();
    } catch (err) {
      console.error(err);
      setActionError("Failed to transfer ownership.");
    }
  };

  const handleLeaveStudio = async () => {
    if (studios.length === 0) return;
    const currentStudio = studios[0];

    const ownerCount = members.filter(m => m.role === "owner").length;
    if (currentStudio.userRole === "owner" && ownerCount <= 1) {
      alert("You are the only Owner of this studio. You must transfer ownership to another member before leaving.");
      return;
    }

    if (!confirm("Are you sure you want to leave this studio? You will lose all access to its events and settings.")) return;

    try {
      setActionError("");
      await removeStudioMember(currentStudio.studioId, user.uid);
      await loadInitialData();
    } catch (err) {
      console.error(err);
      setActionError("Failed to leave studio.");
    }
  };

  if (authLoading || !user || isFetching) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-zinc-50 dark:bg-black transition-colors duration-300">
        <div className="flex flex-col items-center gap-2">
          <svg className="animate-spin h-8 w-8 text-indigo-650" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm text-zinc-550">Loading Studio environment...</span>
        </div>
      </div>
    );
  }

  // Render incoming invites section at the top if present
  const renderIncomingInvites = () => {
    if (incomingInvites.length === 0) return null;
    return (
      <div className="mb-8 rounded-2xl bg-indigo-50 border border-indigo-200/80 p-5 dark:bg-indigo-950/20 dark:border-indigo-900/50">
        <h2 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider mb-3">Pending Invitations Received</h2>
        <div className="space-y-3">
          {incomingInvites.map((invite) => (
            <div key={invite.invitationId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  {invite.studioName}
                </p>
                <p className="text-xs text-zinc-500 font-light mt-0.5">
                  Invited to join as a <span className="font-semibold text-indigo-600 dark:text-indigo-400 capitalize">{invite.role}</span>.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAcceptInvite(invite.invitationId)}
                  className="rounded-full bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white transition-colors"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleRejectInvite(invite.invitationId)}
                  className="rounded-full border border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800 px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-colors"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Case 1: User has no studio
  if (studios.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-black min-h-[80vh] flex flex-col justify-center items-center transition-colors duration-300">
        <div className="w-full max-w-md">
          {renderIncomingInvites()}
        </div>
        <div className="text-center">
          <div className="mb-6 h-20 w-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center text-indigo-650 dark:text-indigo-400 mx-auto">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v16.5m16.5-16.5v16.5m-13.5-12.75h3m-3 3h3m-3 3h3m3-6h3m-3 3h3m-3 3h3m-.75 5.25h-3a.75.75 0 00-.75.75v3h4.5v-3a.75.75 0 00-.75-.75z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Establish Your Brand Studio
          </h1>
          <p className="mt-3 text-sm text-zinc-650 dark:text-zinc-400 font-light max-w-md leading-relaxed mx-auto">
            Create a unified branding space, add members, organize proofing galleries under one roof, and stream workflows effortlessly.
          </p>
          <div className="mt-8">
            <Link
              href="/dashboard/studio/new"
              className="rounded-full bg-indigo-650 hover:bg-indigo-600 px-8 py-3.5 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all"
            >
              Create a Studio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: User belongs to a studio
  const currentStudio = studios[0];
  const coverUrl = currentStudio.coverImage || "https://images.unsplash.com/photo-1452587925148-ce544e77e60d?q=80&w=1200&auto=format&fit=crop";
  const isOwnerOrAdmin = currentStudio.userRole === "owner" || currentStudio.userRole === "admin";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-black min-h-screen transition-colors duration-300 text-left">
      {/* Received invites at top */}
      {renderIncomingInvites()}

      {/* Global alert notifications */}
      {actionError && (
        <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 p-4 dark:bg-rose-950/20 dark:border-rose-900/50 flex items-start gap-3">
          <svg className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-xs font-semibold text-rose-800 dark:text-rose-300">Action Failed</p>
            <p className="text-[11px] text-rose-700 dark:text-rose-450 font-light mt-0.5 leading-relaxed">{actionError}</p>
          </div>
        </div>
      )}

      {actionSuccess && (
        <div className="mb-6 rounded-2xl bg-emerald-50 border border-emerald-200/80 p-4 dark:bg-emerald-950/20 dark:border-emerald-900/50 flex items-start gap-3">
          <svg className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Success</p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-450 font-light mt-0.5">{actionSuccess}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-200 pb-6 dark:border-zinc-800 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            {currentStudio.studioName}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 font-light">
            Manage your brand workspace, settings, and public profile view.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/studio/${currentStudio.studioSlug}`}
            target="_blank"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-350 dark:border-zinc-800 bg-white hover:bg-zinc-50 px-5 py-2.5 text-xs font-bold text-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 transition-all select-none"
          >
            <span>View Public Studio</span>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </Link>
          {currentStudio.userRole === "owner" && (
            <Link
              href="/dashboard/studio/settings"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-650 hover:bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all"
            >
              <span>Studio Settings</span>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              </svg>
            </Link>
          )}
          <button
            onClick={handleLeaveStudio}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 px-5 py-2.5 text-xs font-bold transition-all dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/40"
          >
            Leave Studio
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left branding summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-850 dark:bg-zinc-950/20">
            <div className="relative aspect-video rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden flex items-center justify-center">
              <img src={coverUrl} alt="Cover Preview" className="h-full w-full object-cover" />
            </div>

            <div className="flex justify-center -mt-12 relative z-10 mb-4">
              <div className="h-20 w-20 rounded-full bg-indigo-600 border-4 border-white shadow-md dark:border-zinc-950 overflow-hidden flex items-center justify-center text-white text-2xl font-bold">
                {currentStudio.logo ? (
                  <img src={currentStudio.logo} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  currentStudio.studioName.charAt(0).toUpperCase()
                )}
              </div>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-md font-bold text-zinc-900 dark:text-zinc-50">{currentStudio.studioName}</h3>
              <p className="text-xs text-zinc-500 font-light">slug: {currentStudio.studioSlug}</p>
              <div className="inline-block px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 text-[10px] font-bold uppercase mt-2">
                Your Role: {currentStudio.userRole}
              </div>
            </div>

            {/* Sidebar Tab Selection */}
            <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-850 flex flex-col gap-2">
              <button
                onClick={() => setActiveTab("overview")}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all w-full text-left ${
                  activeTab === "overview"
                    ? "bg-indigo-50/50 text-indigo-650 dark:bg-indigo-950/20 dark:text-indigo-400"
                    : "text-zinc-550 hover:bg-zinc-100/50 dark:text-zinc-400 dark:hover:bg-zinc-900/45"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("members")}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all w-full text-left ${
                  activeTab === "members"
                    ? "bg-indigo-50/50 text-indigo-650 dark:bg-indigo-950/20 dark:text-indigo-400"
                    : "text-zinc-550 hover:bg-zinc-100/50 dark:text-zinc-400 dark:hover:bg-zinc-900/45"
                }`}
              >
                <span>Members & Teams</span>
                <span className="bg-zinc-100 dark:bg-zinc-900 text-zinc-550 dark:text-zinc-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {members.length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Info Section */}
        <div className="lg:col-span-2">
          {activeTab === "overview" ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-850 dark:bg-zinc-950/20 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider pb-2 border-b border-zinc-100 dark:border-zinc-850">
                  About the Studio
                </h3>
                <p className="text-sm text-zinc-650 dark:text-zinc-350 font-light mt-3 leading-relaxed whitespace-pre-line">
                  {currentStudio.description || "No description provided yet."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentStudio.email && (
                  <div className="flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">Email:</span>
                    <span>{currentStudio.email}</span>
                  </div>
                )}
                {currentStudio.phone && (
                  <div className="flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">Phone:</span>
                    <span>{currentStudio.phone}</span>
                  </div>
                )}
                {currentStudio.location && (
                  <div className="flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">Location:</span>
                    <span>{currentStudio.location}</span>
                  </div>
                )}
                {currentStudio.website && (
                  <div className="flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">Website:</span>
                    <a href={currentStudio.website} target="_blank" className="hover:underline text-indigo-650 dark:text-indigo-400">{currentStudio.website}</a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Invite member section (only Owner/Admin) */}
              {isOwnerOrAdmin && (
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-850 dark:bg-zinc-950/20">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider mb-4">
                    Invite a Team Member
                  </h3>
                  
                  {inviteError && <p className="text-xs text-rose-500 mb-3 font-semibold">{inviteError}</p>}
                  {inviteSuccess && <p className="text-xs text-emerald-600 mb-3 font-semibold">{inviteSuccess}</p>}

                  <form onSubmit={handleSendInvite} className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@example.com"
                      className="grow rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-850 dark:bg-zinc-950 dark:text-zinc-100"
                    />
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs text-zinc-900 outline-none dark:border-zinc-850 dark:bg-zinc-950 dark:text-zinc-100"
                    >
                      <option value="admin">Admin (Manage events/invites)</option>
                      <option value="photographer">Photographer (Upload photos)</option>
                      <option value="viewer">Viewer (Read-only)</option>
                    </select>
                    <button
                      type="submit"
                      disabled={sendingInvite}
                      className="rounded-xl bg-indigo-650 hover:bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white transition-colors"
                    >
                      {sendingInvite ? "Inviting..." : "Send Invite"}
                    </button>
                  </form>
                </div>
              )}

              {/* Pending Invites Sent (only Owner/Admin) */}
              {isOwnerOrAdmin && invitations.length > 0 && (
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-850 dark:bg-zinc-950/20">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider mb-4">
                    Sent Pending Invitations
                  </h3>
                  <div className="space-y-3">
                    {invitations.filter(i => i.status === "pending").map((invite) => (
                      <div key={invite.invitationId} className="flex items-center justify-between gap-4 p-3 rounded-lg border border-zinc-150 dark:border-zinc-850 text-xs">
                        <div>
                          <span className="font-bold text-zinc-900 dark:text-zinc-50">{invite.email}</span>
                          <span className="mx-2 text-zinc-300">|</span>
                          <span className="text-zinc-550 capitalize">{invite.role}</span>
                        </div>
                        <button
                          onClick={() => handleCancelInvite(invite.invitationId)}
                          className="text-rose-500 hover:text-rose-600 font-bold hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Members List */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-850 dark:bg-zinc-950/20">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider mb-4">
                  Studio Team Members ({members.length})
                </h3>

                {loadingMembers ? (
                  <p className="text-xs text-zinc-450">Retrieving member details...</p>
                ) : (
                  <>
                    {/* Desktop Members Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-850 text-left text-xs">
                        <thead>
                          <tr className="text-zinc-450 uppercase font-semibold">
                            <th className="py-3 px-4">Name</th>
                            <th className="py-3 px-4">Email</th>
                            <th className="py-3 px-4">Role</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                          {members.map((member) => (
                            <tr key={member.userId} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                              <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-50">{member.displayName}</td>
                              <td className="py-3 px-4 text-zinc-650 dark:text-zinc-400">{member.email}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  member.role === "owner" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400" :
                                  member.role === "admin" ? "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400" :
                                  member.role === "photographer" ? "bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-400" :
                                  "bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                                }`}>
                                  {member.role}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right space-x-2">
                                {/* Promote/Demote Actions */}
                                {currentStudio.userRole === "owner" && member.role !== "owner" && (
                                  <>
                                    {member.role !== "admin" && (
                                      <button onClick={() => handlePromote(member)} className="text-indigo-650 hover:underline">Promote</button>
                                    )}
                                    {member.role !== "viewer" && (
                                      <button onClick={() => handleDemote(member)} className="text-indigo-650 hover:underline">Demote</button>
                                    )}
                                    <button onClick={() => handleTransferOwnership(member)} className="text-amber-650 hover:underline">Make Owner</button>
                                  </>
                                )}
                                {currentStudio.userRole === "admin" && (member.role === "photographer" || member.role === "viewer") && (
                                  <>
                                    {member.role === "viewer" && (
                                      <button onClick={() => handlePromote(member)} className="text-indigo-650 hover:underline">Promote</button>
                                    )}
                                    {member.role === "photographer" && (
                                      <button onClick={() => handleDemote(member)} className="text-indigo-650 hover:underline">Demote</button>
                                    )}
                                  </>
                                )}
                                
                                {/* Remove Action */}
                                {member.userId !== user.uid && (
                                  <>
                                    {currentStudio.userRole === "owner" && (
                                      <button onClick={() => handleRemoveMember(member)} className="text-rose-500 hover:underline font-semibold">Remove</button>
                                    )}
                                    {currentStudio.userRole === "admin" && (member.role === "photographer" || member.role === "viewer") && (
                                      <button onClick={() => handleRemoveMember(member)} className="text-rose-500 hover:underline font-semibold">Remove</button>
                                    )}
                                  </>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Members Profile Cards */}
                    <div className="md:hidden space-y-4">
                      {members.map((member) => (
                        <div key={member.userId} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{member.displayName}</p>
                              <p className="text-xs text-zinc-500 font-light mt-0.5">{member.email}</p>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              member.role === "owner" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400" :
                              member.role === "admin" ? "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400" :
                              member.role === "photographer" ? "bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-400" :
                              "bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                            }`}>
                              {member.role}
                            </span>
                          </div>

                          {/* Member actions panel */}
                          {member.userId !== user.uid && (
                            <div className="flex flex-wrap gap-2 pt-2.5 border-t border-zinc-200/60 dark:border-zinc-800/60 text-xs">
                              {currentStudio.userRole === "owner" && member.role !== "owner" && (
                                <>
                                  {member.role !== "admin" && (
                                    <button onClick={() => handlePromote(member)} className="px-2.5 py-1 rounded-md border border-zinc-200 hover:bg-zinc-100 text-indigo-650 dark:border-zinc-800">Promote</button>
                                  )}
                                  {member.role !== "viewer" && (
                                    <button onClick={() => handleDemote(member)} className="px-2.5 py-1 rounded-md border border-zinc-200 hover:bg-zinc-100 text-indigo-650 dark:border-zinc-800">Demote</button>
                                  )}
                                  <button onClick={() => handleTransferOwnership(member)} className="px-2.5 py-1 rounded-md border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-400">Make Owner</button>
                                </>
                              )}
                              
                              {currentStudio.userRole === "admin" && (member.role === "photographer" || member.role === "viewer") && (
                                <>
                                  {member.role === "viewer" && (
                                    <button onClick={() => handlePromote(member)} className="px-2.5 py-1 rounded-md border border-zinc-200 hover:bg-zinc-100 text-indigo-650 dark:border-zinc-800">Promote</button>
                                  )}
                                  {member.role === "photographer" && (
                                    <button onClick={() => handleDemote(member)} className="px-2.5 py-1 rounded-md border border-zinc-200 hover:bg-zinc-100 text-indigo-650 dark:border-zinc-800">Demote</button>
                                  )}
                                </>
                              )}

                              {((currentStudio.userRole === "owner") || (currentStudio.userRole === "admin" && (member.role === "photographer" || member.role === "viewer"))) && (
                                <button onClick={() => handleRemoveMember(member)} className="px-2.5 py-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400">Remove</button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
