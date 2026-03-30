import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'No authorization header' })

  const userToken = authHeader.replace('Bearer ', '')

  // Verifica token e ottieni user_id
  const supabaseUser = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  )
  const { data: { user }, error: authError } = await supabaseUser.auth.getUser(userToken)
  if (authError || !user) return res.status(401).json({ error: 'Invalid token' })

  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    // 1. Ottieni lista candidature dell'utente (serve per cancellare checklist)
    const { data: cands } = await supabaseAdmin
      .from('candidature')
      .select('id')
      .eq('user_id', user.id)

    // 2. Cancella checklist_items (FK → candidature, va prima)
    if (cands && cands.length > 0) {
      const ids = cands.map(c => c.id)
      await supabaseAdmin
        .from('checklist_items')
        .delete()
        .in('candidatura_id', ids)
    }

    // 3. Cancella candidature
    await supabaseAdmin
      .from('candidature')
      .delete()
      .eq('user_id', user.id)

    // 4. Cancella profilo
    await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('id', user.id)

    // 5. Cancella utente da auth.users — libera l'email definitivamente
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    if (deleteError) {
      console.error('deleteUser error:', deleteError)
      return res.status(500).json({ error: deleteError.message })
    }

    return res.status(200).json({ success: true })

  } catch (err) {
    console.error('delete-account error:', err)
    return res.status(500).json({ error: err.message })
  }
}