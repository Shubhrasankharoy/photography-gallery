import { getRecoveryProvider } from './recoveryFactory';

/**
 * Cleanup Hooks for future scheduled cron jobs / Cloud Functions
 */
export async function getExpiredItems(cutoffDate) {
  const provider = getRecoveryProvider();
  return await provider.getExpiredItems(cutoffDate);
}

export async function cleanupCandidate(trashItem) {
  const provider = getRecoveryProvider();
  return await provider.cleanupCandidate(trashItem);
}

export async function executeAutomatedCleanup(candidates) {
  const provider = getRecoveryProvider();
  return await provider.executeCleanup(candidates);
}
