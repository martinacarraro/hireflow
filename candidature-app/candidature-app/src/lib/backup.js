const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const ownedKey = key => key.startsWith('lfs_') || key === 'lingua'

export function validateBackup(backup) {
  if (!isRecord(backup) || !Array.isArray(backup.candidature) || !isRecord(backup.profile)
    || (backup.version != null && ![1, 2].includes(backup.version))) throw new Error('invalid-backup')
  const ids = new Set()
  for (const c of backup.candidature) {
    if (!isRecord(c) || typeof c.id !== 'string' || !c.id || ids.has(c.id)
      || typeof c.azienda !== 'string' || typeof c.ruolo !== 'string' || typeof c.stato !== 'string'
      || (c.interviews != null && (!Array.isArray(c.interviews) || c.interviews.some(e => !isRecord(e))))) throw new Error('invalid-backup')
    ids.add(c.id)
  }
  if (backup.local_storage != null && (!isRecord(backup.local_storage)
    || Object.entries(backup.local_storage).some(([key,value]) => ownedKey(key) && typeof value !== 'string'))) throw new Error('invalid-backup')
  return backup
}

export function createBackup(storage, profile, candidature, now = new Date()) {
  return {
    version: 2, exported_at: now.toISOString(), profile, candidature,
    local_storage: Object.fromEntries(Object.keys(storage).filter(ownedKey).map(key => [key, storage.getItem(key)])),
  }
}

export function restoreBackupData(storage, backup) {
  validateBackup(backup)
  const before = Object.fromEntries(Object.keys(storage).filter(ownedKey).map(key => [key,storage.getItem(key)]))
  const next = Object.fromEntries(Object.entries(backup.local_storage || {}).filter(([key]) => ownedKey(key)))
  next.lfs_candidature = JSON.stringify(backup.candidature)
  next.lfs_profile = JSON.stringify(backup.profile)
  next.lfs_onboarding_done = '1'
  const changed = new Set([...Object.keys(before), ...Object.keys(next)].filter(key => before[key] !== next[key]))
  try {
    // Keep current keys until every replacement has been written successfully.
    for (const key of changed) if (key in next) storage.setItem(key,next[key])
    for (const key of changed) if (!(key in next)) storage.removeItem(key)
  } catch (cause) {
    try {
      // Release new values before restoring the snapshot (including quota errors).
      for (const key of changed) storage.removeItem(key)
      for (const key of changed) if (key in before) storage.setItem(key,before[key])
    } catch {
      throw new Error('restore-rollback-failed', {cause})
    }
    throw new Error('restore-failed', {cause})
  }
}
