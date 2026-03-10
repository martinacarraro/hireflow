// api/cron-notify.js
// Vercel Cron: ogni mattina alle 8:00 controlla colloqui e manda push
// Configura in vercel.json: { "crons": [{ "path": "/api/cron-notify", "schedule": "0 7 * * *" }] }

import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // Vercel cron usa GET, proteggila con un secret
  const authHeader = req.headers['authorization']
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  // Carica tutti gli utenti con push subscription attiva
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, nome, push_subscription')
    .not('push_subscription', 'is', null)

  if (!profiles?.length) return res.status(200).json({ sent: 0 })

  let sent = 0
  const errors = []

  for (const profile of profiles) {
    if (!profile.push_subscription) continue

    // Carica candidature di questo utente con colloquio oggi o domani
    const { data: cands } = await supabase
      .from('candidature')
      .select('id, azienda, ruolo, data_colloquio, ora_colloquio, data_secondo_colloquio, ora_secondo_colloquio, stato')
      .eq('user_id', profile.id)
      .or(`data_colloquio.eq.${todayStr},data_colloquio.eq.${tomorrowStr},data_secondo_colloquio.eq.${todayStr},data_secondo_colloquio.eq.${tomorrowStr}`)

    if (!cands?.length) continue

    for (const c of cands) {
      const notifications = []

      // 1° colloquio
      if (c.data_colloquio === tomorrowStr) {
        notifications.push({
          title: `🎙️ Colloquio domani — ${c.azienda}`,
          body: `${c.ruolo}${c.ora_colloquio ? ` alle ${c.ora_colloquio.slice(0,5)}` : ''}. Preparati! 💪`,
          url: '/'
        })
      } else if (c.data_colloquio === todayStr) {
        notifications.push({
          title: `🎙️ Colloquio oggi — ${c.azienda}!`,
          body: `${c.ruolo}${c.ora_colloquio ? ` alle ${c.ora_colloquio.slice(0,5)}` : ''}. In bocca al lupo! 🍀`,
          url: '/'
        })
      }

      // 2° colloquio
      if (c.data_secondo_colloquio === tomorrowStr) {
        notifications.push({
          title: `🎙️🎙️ 2° Colloquio domani — ${c.azienda}`,
          body: `${c.ruolo}${c.ora_secondo_colloquio ? ` alle ${c.ora_secondo_colloquio.slice(0,5)}` : ''}. Ci siamo! 🚀`,
          url: '/'
        })
      } else if (c.data_secondo_colloquio === todayStr) {
        notifications.push({
          title: `🎙️🎙️ 2° Colloquio oggi — ${c.azienda}!`,
          body: `${c.ruolo}${c.ora_secondo_colloquio ? ` alle ${c.ora_secondo_colloquio.slice(0,5)}` : ''}. In bocca al lupo! 🍀`,
          url: '/'
        })
      }

      // Invia ogni notifica
      for (const notif of notifications) {
        try {
          const resp = await fetch(`${process.env.VITE_APP_URL}/api/send-push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subscription: profile.push_subscription,
              ...notif
            })
          })

          if (resp.status === 410) {
            // Subscription scaduta — la rimuoviamo
            await supabase
              .from('user_profiles')
              .update({ push_subscription: null })
              .eq('id', profile.id)
          } else {
            sent++
          }
        } catch (err) {
          errors.push({ userId: profile.id, error: err.message })
        }
      }
    }

    // Controlla anche promemoria personalizzati (reminder_date = oggi)
    const { data: reminders } = await supabase
      .from('candidature')
      .select('id, azienda, ruolo, reminder_date, reminder_time, reminder_note')
      .eq('user_id', profile.id)
      .eq('reminder_date', todayStr)
      .not('reminder_date', 'is', null)

    for (const r of reminders || []) {
      try {
        await fetch(`${process.env.VITE_APP_URL}/api/send-push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: profile.push_subscription,
            title: `⏰ Promemoria — ${r.azienda}`,
            body: r.reminder_note || r.ruolo || 'Hai un promemoria oggi',
            url: '/'
          })
        })
        sent++
      } catch (err) {
        errors.push({ userId: profile.id, error: err.message })
      }
    }
  }

  return res.status(200).json({ sent, errors })
}