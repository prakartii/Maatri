/**
 * Offline Sync Service — handles data sync for low-connectivity field workers.
 */

/**
 * Queue local changes for sync when connectivity is restored.
 * @param {Object} _payload
 * @returns {Promise<Object>}
 */
export const queueForSync = async (_payload) => {
  // TODO: Implement offline queue persistence
  throw new Error("offlineSyncService.queueForSync() not implemented");
};

/**
 * Process pending sync queue and push to Supabase.
 * @returns {Promise<Object>}
 */
export const processSyncQueue = async () => {
  // TODO: Implement batch sync to backend
  throw new Error("offlineSyncService.processSyncQueue() not implemented");
};

/**
 * Pull latest patient and visit data for offline cache.
 * @param {string} _workerId
 * @returns {Promise<Object>}
 */
export const pullOfflineBundle = async (_workerId) => {
  // TODO: Implement offline data bundle download
  throw new Error("offlineSyncService.pullOfflineBundle() not implemented");
};
