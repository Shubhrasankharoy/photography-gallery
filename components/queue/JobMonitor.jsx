'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { queueService } from '../../lib/queue/queueService';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

/* ── Motion Variants ──────────────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

export default function JobMonitor({ studioId }) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
    dead: 0,
    total: 0,
    activeWorkers: 0,
    avgDurationMs: 0,
    throughput: 0,
    retryRate: 0
  });

  const calculateStats = (jobsList) => {
    const now = Date.now();
    const currentStats = {
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
      dead: 0,
      total: jobsList.length,
      activeWorkers: 0,
      avgDurationMs: 0,
      throughput: 0,
      retryRate: 0
    };

    const workerSet = new Set();
    let totalProcTimeMs = 0;
    let procTimeCount = 0;
    let retriedCount = 0;
    let completedInLastTenMin = 0;

    jobsList.forEach(job => {
      // Count statuses
      if (currentStats[job.status] !== undefined) {
        currentStats[job.status]++;
      }

      // Check active heartbeats
      if (job.status === 'running' && job.workerId && job.leaseExpiresAt) {
        const leaseExp = job.leaseExpiresAt.toDate ? job.leaseExpiresAt.toDate() : new Date(job.leaseExpiresAt);
        if (leaseExp.getTime() > now) {
          workerSet.add(job.workerId);
        }
      }

      // Calc processing time
      if (job.status === 'completed' && job.startedAt && job.completedAt) {
        const start = job.startedAt.toDate ? job.startedAt.toDate().getTime() : new Date(job.startedAt).getTime();
        const end = job.completedAt.toDate ? job.completedAt.toDate().getTime() : new Date(job.completedAt).getTime();
        totalProcTimeMs += (end - start);
        procTimeCount++;

        // Throughput (completed within last 10 mins)
        if (now - end < 600000) {
          completedInLastTenMin++;
        }
      }

      if (job.attempts > 0) {
        retriedCount++;
      }
    });

    currentStats.activeWorkers = workerSet.size;
    currentStats.avgDurationMs = procTimeCount > 0 ? Math.round(totalProcTimeMs / procTimeCount) : 0;
    currentStats.throughput = Number((completedInLastTenMin / 10).toFixed(1)); // jobs/minute
    currentStats.retryRate = jobsList.length > 0 ? Number(((retriedCount / jobsList.length) * 100).toFixed(1)) : 0;

    setStats(currentStats);
  };

  useEffect(() => {
    if (!studioId) return;

    // Real-time listener for the latest 100 jobs in this studio
    const q = query(
      collection(db, 'faceIndexJobs'),
      where('studioId', '==', studioId),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setJobs(jobsList);
      calculateStats(jobsList);
      setLoading(false);
    }, (error) => {
      console.error("Error subscribing to faceIndexJobs:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [studioId]);

  const handleRetry = async (jobId) => {
    try {
      await queueService.retryJob(jobId, user);
    } catch (err) {
      alert(`Failed to retry job: ${err.message}`);
    }
  };

  const handleCancel = async (jobId) => {
    try {
      await queueService.cancelJob(jobId, 'Cancelled by user via dashboard', user);
    } catch (err) {
      alert(`Failed to cancel job: ${err.message}`);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-50/90 text-amber-800 border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400';
      case 'running':
        return 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20 animate-pulse';
      case 'completed':
        return 'bg-emerald-50/90 text-emerald-800 border-emerald-200/50 dark:bg-emerald-955/20 dark:text-emerald-400';
      case 'failed':
        return 'bg-rose-50/90 text-rose-800 border-rose-250/30 dark:bg-rose-955/20 dark:text-rose-400';
      case 'dead':
        return 'bg-rose-50/90 text-rose-800 border-rose-250/30 dark:bg-rose-955/20 dark:text-rose-450';
      default:
        return 'bg-zinc-50/80 text-zinc-550 border-zinc-200/60 dark:bg-[#181818] dark:text-zinc-400 dark:border-zinc-800/40';
    }
  };

  const formatPriority = (pCode) => {
    if (!pCode) return 'Normal';
    if (pCode.includes('high')) return 'High';
    if (pCode.includes('low')) return 'Low';
    return 'Normal';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48 bg-[#F7F7F7] dark:bg-[#181818] transition-colors duration-300">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#D4AF37] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1 */}
        <motion.div
          variants={itemVariants}
          className="rounded-[20px] border border-zinc-200/60 bg-white p-5 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lg)] dark:border-zinc-800/40 dark:bg-[#262626] transition-all duration-300"
        >
          <span className="text-[10px] font-bold text-[#8E8E8E] uppercase tracking-widest block">Queue Length</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-2 block">
            {stats.pending + stats.running}
          </span>
          <span className="text-[10px] text-[#8E8E8E] font-light mt-1.5 block">
            {stats.pending} pending, {stats.running} running
          </span>
        </motion.div>

        {/* Metric 2 */}
        <motion.div
          variants={itemVariants}
          className="rounded-[20px] border border-zinc-200/60 bg-white p-5 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lg)] dark:border-zinc-800/40 dark:bg-[#262626] transition-all duration-300"
        >
          <span className="text-[10px] font-bold text-[#8E8E8E] uppercase tracking-widest block">Active Workers</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#D4AF37] mt-2 block">
            {stats.activeWorkers}
          </span>
          <span className="text-[10px] text-[#8E8E8E] font-light mt-1.5 block">
            Active leases
          </span>
        </motion.div>

        {/* Metric 3 */}
        <motion.div
          variants={itemVariants}
          className="rounded-[20px] border border-zinc-200/60 bg-white p-5 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lg)] dark:border-zinc-800/40 dark:bg-[#262626] transition-all duration-300"
        >
          <span className="text-[10px] font-bold text-[#8E8E8E] uppercase tracking-widest block">Avg Processing Time</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-2 block">
            {stats.avgDurationMs > 0 ? `${(stats.avgDurationMs / 1000).toFixed(1)}s` : 'N/A'}
          </span>
          <span className="text-[10px] text-[#8E8E8E] font-light mt-1.5 block">
            Per completed job
          </span>
        </motion.div>

        {/* Metric 4 */}
        <motion.div
          variants={itemVariants}
          className="rounded-[20px] border border-zinc-200/60 bg-white p-5 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lg)] dark:border-zinc-800/40 dark:bg-[#262626] transition-all duration-300"
        >
          <span className="text-[10px] font-bold text-[#8E8E8E] uppercase tracking-widest block">Throughput</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-2 block">
            {stats.throughput} <span className="text-xs text-[#8E8E8E] font-normal">/min</span>
          </span>
          <span className="text-[10px] text-[#8E8E8E] font-light mt-1.5 block">
            Last 10 minutes
          </span>
        </motion.div>

        {/* Metric 5 */}
        <motion.div
          variants={itemVariants}
          className="rounded-[20px] border border-zinc-200/60 bg-white p-5 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lg)] dark:border-zinc-800/40 dark:bg-[#262626] transition-all duration-300 col-span-2 lg:col-span-1"
        >
          <span className="text-[10px] font-bold text-[#8E8E8E] uppercase tracking-widest block">Failed / Dead</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-2 block">
            {stats.failed + stats.dead}
          </span>
          <span className="text-[10px] text-[#8E8E8E] font-light mt-1.5 block">
            Retry rate: {stats.retryRate}%
          </span>
        </motion.div>
      </div>

      {/* Jobs Log Table */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-[20px] border border-zinc-200/50 shadow-[var(--shadow-soft)] overflow-hidden dark:bg-[#262626] dark:border-zinc-800/40"
      >
        <div className="px-5 py-4 border-b border-zinc-200/50 dark:border-zinc-800/40 flex justify-between items-center bg-transparent">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-50 font-headline">AI Background Processing Queue</h3>
          <span className="text-[10px] font-bold text-[#8E8E8E] uppercase tracking-wider">Showing last 100 jobs</span>
        </div>

        <div className="overflow-x-auto">
          {jobs.length === 0 ? (
            <div className="p-8 text-center text-[#8E8E8E] font-light text-xs">
              No background AI jobs found for this studio.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200/50 dark:border-zinc-800/40 text-[#8E8E8E] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Job ID / File</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Progress</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Attempts</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-[10px] text-[#8E8E8E]">{job.jobId}</div>
                      <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 truncate max-w-xs font-light">
                        Photo ID: {job.photoId}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-[10px] bg-zinc-55 text-zinc-650 px-2 py-0.5 rounded-[12px] border border-zinc-200/60 dark:bg-[#181818] dark:text-zinc-400 dark:border-zinc-800/40">
                        {job.jobType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold ${formatPriority(job.priority) === 'High' ? 'text-[#D4AF37]' : 'text-zinc-600 dark:text-zinc-400'}`}>
                        {formatPriority(job.priority)}
                      </span>
                    </td>
                    <td className="px-6 py-4 w-48">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-24 bg-zinc-150 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-[#D4AF37] h-1.5 rounded-full transition-all duration-300" 
                            style={{ width: `${job.progress || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400">{job.progress || 0}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadgeClass(job.status)}`}>
                        {job.status}
                      </span>
                      {job.lastError && (
                        <div className="text-[10px] text-rose-500 mt-1.5 max-w-xs truncate font-light" title={job.lastError}>
                          {job.lastError}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 font-mono text-[10px]">
                      {job.attempts} / {job.maxAttempts}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {(job.status === 'failed' || job.status === 'dead') && (
                          <button
                            onClick={() => handleRetry(job.id)}
                            className="text-[10px] bg-[#D4AF37] hover:bg-[#E0C55B] text-[#181818] px-3 py-1.5 rounded-[12px] transition-colors font-bold shadow-xs select-none"
                          >
                            Retry
                          </button>
                        )}
                        {(job.status === 'pending' || job.status === 'running') && (
                          <button
                            onClick={() => handleCancel(job.id)}
                            className="text-[10px] bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 px-3 py-1.5 rounded-[12px] transition-colors font-bold dark:bg-[#2D1818] dark:border-rose-900/50 dark:text-rose-400"
                          >
                            Cancel
                          </button>
                        )}
                        {!(job.status === 'failed' || job.status === 'dead' || job.status === 'pending' || job.status === 'running') && (
                          <span className="text-zinc-400 dark:text-zinc-650 font-light pr-2">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
