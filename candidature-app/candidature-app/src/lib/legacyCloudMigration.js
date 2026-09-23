const MIGRATION_KEY = 'lfs_cloud_migration_v1'

const getConfig = () => ({
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
})

function findStoredSession() {
  const key = Object.keys(localStorage).find(k => /^sb-.+-auth-token$/.test(k))
  if (!key) return null
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null')
    const session = value?.currentSession || value
    return session?.access_token ? { key, session } : null
  } catch {
    return null
  }
}

async function refreshSession(session, config) {
  if (!session?.refresh_token) return session
  const response = await fetch(`${config.url}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: {
      apikey: config.anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  })
  if (!response.ok) throw new Error('session-expired')
  return response.json()
}

async function getValidSession(session, config) {
  const expiresAt = Number(session?.expires_at || 0)
  if (expiresAt && expiresAt * 1000 > Date.now() + 30_000) return session
  return refreshSession(session, config)
}

async function readTable(table, query, session, config) {
  const response = await fetch(`${config.url}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${session.access_token}`,
      Accept: 'application/json',
    },
  })
  if (!response.ok) throw new Error(response.status === 401 ? 'session-expired' : 'cloud-read-failed')
  return response.json()
}

function mergeCandidature(cloudRows, localRows) {
  const rows = new Map()
  cloudRows.forEach(row => rows.set(row.id, row))
  localRows.forEach(row => rows.set(row.id, row))
  return [...rows.values()].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
}

function mergeProfile(cloudProfile, localProfile) {
  const cloud = cloudProfile || {}
  const local = localProfile || {}
  const badges = new Set([
    ...(cloud.badge_lista || '').split(','),
    ...(local.badge_lista || '').split(','),
  ].filter(Boolean))

  return {
    ...cloud,
    ...local,
    id: 'local',
    nome: local.nome?.trim() || cloud.nome || '',
    xp_points: Math.max(Number(cloud.xp_points || 0), Number(local.xp_points || 0)),
    streak_giorni: Math.max(Number(cloud.streak_giorni || 0), Number(local.streak_giorni || 0)),
    seen_onboarding: Boolean(cloud.seen_onboarding || local.seen_onboarding),
    badge_lista: [...badges].join(','),
    cloud_migrated_at: new Date().toISOString(),
  }
}

function saveChecklists(cloudItems) {
  const grouped = new Map()
  cloudItems.forEach(item => {
    if (!grouped.has(item.candidatura_id)) grouped.set(item.candidatura_id, [])
    grouped.get(item.candidatura_id).push(item)
  })

  grouped.forEach((cloudList, candidaturaId) => {
    const key = `lfs_checklist_${candidaturaId}`
    let localList = []
    try { localList = JSON.parse(localStorage.getItem(key) || '[]') } catch {}
    const merged = new Map()
    cloudList.forEach(item => merged.set(item.id || item.task, item))
    localList.forEach(item => merged.set(item.id || item.task, item))
    localStorage.setItem(key, JSON.stringify([...merged.values()].sort((a, b) => (a.ordine || 0) - (b.ordine || 0))))
  })
}

async function migrateSession(rawSession, localCandidature, localProfile, storedSessionKey = null) {
  const config = getConfig()
  if (!config.url || !config.anonKey) throw new Error('migration-unavailable')

  const session = await getValidSession(rawSession, config)
  const userId = session.user?.id
  if (!userId) throw new Error('invalid-session')

  const encodedUser = encodeURIComponent(userId)
  const [cloudCandidature, profiles, checklistItems] = await Promise.all([
    readTable('candidature', `select=*&user_id=eq.${encodedUser}&order=created_at.desc`, session, config),
    readTable('user_profiles', `select=*&id=eq.${encodedUser}&limit=1`, session, config),
    readTable('checklist_items', `select=*&user_id=eq.${encodedUser}&order=ordine.asc`, session, config),
  ])

  const candidature = mergeCandidature(cloudCandidature || [], localCandidature || [])
  const profile = mergeProfile(profiles?.[0], localProfile)
  saveChecklists(checklistItems || [])
  localStorage.setItem('lfs_candidature', JSON.stringify(candidature))
  localStorage.setItem('lfs_profile', JSON.stringify(profile))
  localStorage.setItem(MIGRATION_KEY, JSON.stringify({
    completed_at: new Date().toISOString(),
    candidature_imported: cloudCandidature?.length || 0,
    checklist_imported: checklistItems?.length || 0,
  }))

  // La vecchia sessione viene rimossa dal dispositivo solo dopo il salvataggio riuscito.
  if (storedSessionKey) localStorage.removeItem(storedSessionKey)

  return {
    candidature,
    profile,
    importedCount: cloudCandidature?.length || 0,
    checklistCount: checklistItems?.length || 0,
  }
}

export async function migrateStoredLegacySession(localCandidature, localProfile) {
  if (localStorage.getItem(MIGRATION_KEY)) return null
  const stored = findStoredSession()
  if (!stored) return null
  return migrateSession(stored.session, localCandidature, localProfile, stored.key)
}

export async function recoverLegacyCloudData(email, password, localCandidature, localProfile) {
  const config = getConfig()
  if (!config.url || !config.anonKey) throw new Error('migration-unavailable')

  const response = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: config.anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })
  if (!response.ok) throw new Error('invalid-credentials')
  const session = await response.json()
  return migrateSession(session, localCandidature, localProfile)
}
