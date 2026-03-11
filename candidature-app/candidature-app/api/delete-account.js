import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'No authorization header' })

  const userToken = authHeader.replace('Bearer ', '')

  // Verifica che il token sia valido e ottieni lo user_id
  const supabaseUser = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  )
  const { data: { user }, error: authError } = await supabaseUser.auth.getUser(userToken)
  if (authError || !user) return res.status(401).json({ error: 'Invalid token' })

  // Usa service role per eliminare l'utente da auth.users
  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Elimina dati utente dalle tabelle
  await supabaseAdmin.from('candidature').delete().eq('user_id', user.id)
  await supabaseAdmin.from('user_profiles').delete().eq('id', user.id)

  // Elimina l'utente da auth.users — questo è il passaggio chiave
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
  if (deleteError) return res.status(500).json({ error: deleteError.message })

  return res.status(200).json({ success: true })
}