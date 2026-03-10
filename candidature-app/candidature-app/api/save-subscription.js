// api/save-subscription.js — salva la push subscription dell'utente in Supabase
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { userId, subscription } = req.body
  if (!userId || !subscription) return res.status(400).json({ error: 'Missing fields' })

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // service role key — solo lato server!
  )

  const { error } = await supabase
    .from('user_profiles')
    .update({ push_subscription: subscription })
    .eq('id', userId)

  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ ok: true })
}