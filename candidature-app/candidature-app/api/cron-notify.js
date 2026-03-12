// api/cron-notify.js
// Vercel Cron — ogni mattina alle 8:00 IT (7:00 UTC)
// vercel.json: { "crons": [{ "path": "/api/cron-notify", "schedule": "0 7 * * *" }] }

import { createClient } from '@supabase/supabase-js'

const PUSH_URL = `${process.env.VITE_APP_URL}/api/send-push`

export default async function handler(req, res) {
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
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, nome, genere, push_subscription, notifiche_push_globali, ultimo_accesso')
    .not('push_subscription', 'is', null)

  if (!profiles?.length) return res.status(200).json({ sent: 0 })

  let sent = 0
  const errors = []

  const sendPush = async (profile, title, body, url = '/') => {
    try {
      const resp = await fetch(PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: profile.push_subscription, title, body, url })
      })
      if (resp.status === 410 || resp.status === 404) {
        await supabase.from('user_profiles').update({ push_subscription: null }).eq('id', profile.id)
      } else { sent++ }
    } catch (err) { errors.push({ userId: profile.id, error: err.message }) }
  }

  for (const profile of profiles) {
    if (!profile.push_subscription) continue

    const { data: cands } = await supabase
      .from('candidature')
      .select('*')
      .eq('user_id', profile.id)
      .eq('archiviata', false)

    if (!cands) continue

    for (const c of cands) {
      const daysSince = c.data_invio
        ? Math.floor((today - new Date(c.data_invio)) / (1000 * 60 * 60 * 24)) : null

      // Colloquio domani
      if (c.data_colloquio === tomorrowStr) {
        const ora = c.ora_colloquio ? ` alle ${c.ora_colloquio.slice(0,5)}` : ''
        await sendPush(profile, `🎙️ Colloquio domani — ${c.azienda}`,
          `${c.ruolo}${ora}. Prepara le domande e dormi bene! 💪`)
      }
      // Colloquio oggi
      if (c.data_colloquio === todayStr) {
        const ora = c.ora_colloquio ? ` alle ${c.ora_colloquio.slice(0,5)}` : ''
        await sendPush(profile, `🌅 Oggi è il giorno! — ${c.azienda}`,
          `${c.ruolo}${ora}. Respira, sorridi, mostra chi sei. In bocca al lupo! 🍀`)
      }
      // Giorno dopo colloquio — chiedi com'è andata
      if (c.data_colloquio === yesterdayStr &&
          ['Prima call','Colloquio','Secondo colloquio','In attesa risposta'].includes(c.stato)) {
        await sendPush(profile, `☕ Com'è andata con ${c.azienda}?`,
          'Aggiorna lo stato e scrivi le tue impressioni finché sono fresche! 📝')
      }
      // 2° colloquio domani
      if (c.data_secondo_colloquio === tomorrowStr) {
        const ora = c.ora_secondo_colloquio ? ` alle ${c.ora_secondo_colloquio.slice(0,5)}` : ''
        await sendPush(profile, `🎙️🎙️ 2° Colloquio domani — ${c.azienda}`,
          `${c.ruolo}${ora}. Ci sei quasi! 🚀`)
      }
      // 2° colloquio oggi
      if (c.data_secondo_colloquio === todayStr) {
        const ora = c.ora_secondo_colloquio ? ` alle ${c.ora_secondo_colloquio.slice(0,5)}` : ''
        await sendPush(profile, `🎙️🎙️ 2° Colloquio oggi — ${c.azienda}!`,
          `${c.ruolo}${ora}. Stai per chiudere il cerchio! 🍀`)
      }
      // 7 giorni in attesa
      if (daysSince === 7 &&
          ['In attesa risposta','Inviata','Vista'].includes(c.stato) &&
          !c.notifica_7gg_inviata) {
        await sendPush(profile, `⏳ Una settimana da ${c.azienda}`,
          'Ancora niente? Controlla la mail o considera un follow-up gentile! 👀')
        await supabase.from('candidature').update({ notifica_7gg_inviata: true }).eq('id', c.id)
      }
      // 14 giorni in attesa
      if (daysSince === 14 &&
          ['In attesa risposta','Inviata','Vista'].includes(c.stato) &&
          !c.notifica_14gg_inviata) {
        await sendPush(profile, `📧 2 settimane senza risposta — ${c.azienda}`,
          'Un follow-up educato può fare la differenza. O è il momento di andare avanti. 💪')
        await supabase.from('candidature').update({ notifica_14gg_inviata: true }).eq('id', c.id)
      }
      // Offerta in scadenza domani
      if (c.stato === 'Offerta ricevuta' && c.offerta_scadenza === tomorrowStr) {
        await sendPush(profile, `⚠️ Offerta in scadenza domani — ${c.azienda}`,
          'Hai tempo fino a domani per rispondere. Decidi con calma! 💜')
      }
      // Promemoria manuale
      if (c.reminder_date === todayStr) {
        await sendPush(profile, `⏰ Promemoria — ${c.azienda}`,
          c.reminder_note || `${c.ruolo} — hai un promemoria per oggi`)
      }
    }

    // Inattività 7 giorni esatti
    if (profile.ultimo_accesso) {
      const inactiveDays = Math.floor((today - new Date(profile.ultimo_accesso)) / (1000 * 60 * 60 * 24))
      if (inactiveDays === 7) {
        const attive = cands?.filter(c =>
          ['Colloquio','Prima call','In attesa risposta','Secondo colloquio','Offerta ricevuta'].includes(c.stato)
        ).length || 0
        await sendPush(profile, '👋 Bentornat* nella ricerca!',
          attive > 0
            ? `Hai ${attive} candidature attive che aspettano aggiornamenti. 💪`
            : 'È ora di aggiungere nuove candidature. Non mollare! 💜')
      }
    }
  }

  return res.status(200).json({ sent, errors: errors.length })
}