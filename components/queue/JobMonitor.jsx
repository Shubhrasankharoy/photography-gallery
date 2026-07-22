'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { queueService } from '../../lib/queue/queueService';
import { useAuth } from '../../context/AuthContext';

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
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-200 animate-pulse';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'failed':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'dead':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
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
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Queue Length</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{stats.pending + stats.running}</div>
          <div className="text-xs text-slate-400 mt-1">{stats.pending} pending, {stats.running} running</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Workers</div>
          <div className="mt-2 text-2xl font-bold text-indigo-600">{stats.activeWorkers}</div>
          <div className="text-xs text-slate-400 mt-1">Active leases</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Processing Time</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {stats.avgDurationMs > 0 ? `${(stats.avgDurationMs / 1000).toFixed(1)}s` : 'N/A'}
          </div>
          <div className="text-xs text-slate-400 mt-1">Per completed job</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Throughput</div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{stats.throughput} <span className="text-xs text-slate-400 font-normal">/min</span></div>
          <div className="text-xs text-slate-400 mt-1">Last 10 minutes</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm col-span-2 lg:col-span-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Failed / Dead</div>
          <div className="mt-2 text-2xl font-bold text-rose-600">{stats.failed + stats.dead}</div>
          <div className="text-xs text-slate-400 mt-1">Retry rate: {stats.retryRate}%</div>
        </div>
      </div>

      {/* Jobs Log Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-900">AI Background Processing Queue</h3>
          <span className="text-xs text-slate-500">Showing last 100 jobs</span>
        </div>

        <div className="overflow-x-auto">
          {jobs.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No background AI jobs found for this studio.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                  <th className="px-6 py-3 font-semibold text-slate-600">Job ID / File</th>
                  <th className="px-6 py-3 font-semibold text-slate-600">Type</th>
                  <th className="px-6 py-3 font-semibold text-slate-600">Priority</th>
                  <th className="px-6 py-3 font-semibold text-slate-600">Progress</th>
                  <th className="px-6 py-3 font-semibold text-slate-600">Status</th>
                  <th className="px-6 py-3 font-semibold text-slate-600">Attempts</th>
                  <th className="px-6 py-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs text-slate-500">{job.jobId}</div>
                      <div className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">
                        Photo ID: {job.photoId}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        {job.jobType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs ${formatPriority(job.priority) === 'High' ? 'text-amber-600 font-bold' : 'text-slate-600'}`}>
                        {formatPriority(job.priority)}
                      </span>
                    </td>
                    <td className="px-6 py-4 w-48">
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300" 
                            style={{ width: `${job.progress || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-mono text-slate-600">{job.progress || 0}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeClass(job.status)}`}>
                        {job.status}
                      </span>
                      {job.lastError && (
                        <div className="text-xs text-rose-500 mt-1 max-w-xs truncate" title={job.lastError}>
                          {job.lastError}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                      {job.attempts} / {job.maxAttempts}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {(job.status === 'failed' || job.status === 'dead') && (
                          <button
                            onClick={() => handleRetry(job.id)}
                            className="text-xs bg-indigo-600 text-white hover:bg-indigo-700 px-2.5 py-1 rounded transition-colors font-medium"
                          >
                            Retry
                          </button>
                        )}
                        {(job.status === 'pending' || job.status === 'running') && (
                          <button
                            onClick={() => handleCancel(job.id)}
                            className="text-xs bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 px-2.5 py-1 rounded transition-colors font-medium"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
