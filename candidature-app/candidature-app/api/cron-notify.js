// Vercel Cron — ogni mattina alle 8:00 IT (7:00 UTC)
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
    .select('id, nome, genere, push_subscription, notifiche_push_globali, ultimo_accesso, lingua')
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
    
    // Check lingua (default 'it')
    const lang = profile.lingua === 'en' ? 'en' : 'it';

    const { data: cands } = await supabase
      .from('candidature')
      .select('*')
      .eq('user_id', profile.id)
      .eq('archiviata', false)

    if (!cands) continue

    for (const c of cands) {
      const daysSince = c.data_invio
        ? Math.floor((today - new Date(c.data_invio)) / (1000 * 60 * 60 * 24)) : null

      // --- TRADUZIONI ---
      const t = {
        it: {
          collDomaniT: `🎙️ Colloquio domani — ${c.azienda}`,
          collDomaniB: `${c.ruolo}${c.ora_colloquio ? ` alle ${c.ora_colloquio.slice(0,5)}` : ''}. Prepara le domande e dormi bene! 💪`,
          collOggiT: `🌅 Oggi è il giorno! — ${c.azienda}`,
          collOggiB: `${c.ruolo}${c.ora_colloquio ? ` alle ${c.ora_colloquio.slice(0,5)}` : ''}. Respira, sorridi, mostra chi sei. In bocca al lupo! 🍀`,
          comAndataT: `☕ Com'è andata con ${c.azienda}?`,
          comAndataB: 'Aggiorna lo stato e scrivi le tue impressioni finché sono fresche! 📝',
          secCollDomaniT: `🎙️🎙️ 2° Colloquio domani — ${c.azienda}`,
          secCollDomaniB: `${c.ruolo}${c.ora_secondo_colloquio ? ` alle ${c.ora_secondo_colloquio.slice(0,5)}` : ''}. Ci sei quasi! 🚀`,
          secCollOggiT: `🎙️🎙️ 2° Colloquio oggi — ${c.azienda}!`,
          secCollOggiB: `${c.ruolo}${c.ora_secondo_colloquio ? ` alle ${c.ora_secondo_colloquio.slice(0,5)}` : ''}. Stai per chiudere il cerchio! 🍀`,
          week7T: `⏳ Una settimana da ${c.azienda}`,
          week7B: 'Ancora niente? Controlla la mail o considera un follow-up gentile! 👀',
          week14T: `📧 2 settimane senza risposta — ${c.azienda}`,
          week14B: 'Un follow-up educato può fare la differenza. O è il momento di andare avanti. 💪',
          offScadT: `⚠️ Offerta in scadenza domani — ${c.azienda}`,
          offScadB: 'Hai tempo fino a domani per rispondere. Decidi con calma! 💜',
          remT: `⏰ Promemoria — ${c.azienda}`,
          remB: c.reminder_note || `${c.ruolo} — hai un promemoria per oggi`
        },
        en: {
          collDomaniT: `🎙️ Interview tomorrow — ${c.azienda}`,
          collDomaniB: `${c.ruolo}${c.ora_colloquio ? ` at ${c.ora_colloquio.slice(0,5)}` : ''}. Prepare your questions and sleep well! 💪`,
          collOggiT: `🌅 Today is the day! — ${c.azienda}`,
          collOggiB: `${c.ruolo}${c.ora_colloquio ? ` at ${c.ora_colloquio.slice(0,5)}` : ''}. Breathe, smile, show them who you are. Good luck! 🍀`,
          comAndataT: `☕ How did it go with ${c.azienda}?`,
          comAndataB: 'Update the status and write down your thoughts while they are fresh! 📝',
          secCollDomaniT: `🎙️🎙️ 2nd Interview tomorrow — ${c.azienda}`,
          secCollDomaniB: `${c.ruolo}${c.ora_secondo_colloquio ? ` at ${c.ora_secondo_colloquio.slice(0,5)}` : ''}. You are almost there! 🚀`,
          secCollOggiT: `🎙️🎙️ 2nd Interview today — ${c.azienda}!`,
          secCollOggiB: `${c.ruolo}${c.ora_secondo_colloquio ? ` at ${c.ora_secondo_colloquio.slice(0,5)}` : ''}. Closing the deal! 🍀`,
          week7T: `⏳ One week with ${c.azienda}`,
          week7B: 'Still nothing? Check your email or consider a polite follow-up! 👀',
          week14T: `📧 2 weeks with no response — ${c.azienda}`,
          week14B: 'A polite follow-up can make a difference. Or maybe it is time to move on. 💪',
          offScadT: `⚠️ Offer expiring tomorrow — ${c.azienda}`,
          offScadB: 'You have until tomorrow to reply. Take your time to decide! 💜',
          remT: `⏰ Reminder — ${c.azienda}`,
          remB: c.reminder_note || `${c.ruolo} — you have a reminder for today`
        }
      }[lang];

      if (c.data_colloquio === tomorrowStr) await sendPush(profile, t.collDomaniT, t.collDomaniB)
      if (c.data_colloquio === todayStr) await sendPush(profile, t.collOggiT, t.collOggiB)
      if (c.data_colloquio === yesterdayStr && ['Prima call','Colloquio','Secondo colloquio','In attesa risposta'].includes(c.stato)) {
        await sendPush(profile, t.comAndataT, t.comAndataB)
      }
      if (c.data_secondo_colloquio === tomorrowStr) await sendPush(profile, t.secCollDomaniT, t.secCollDomaniB)
      if (c.data_secondo_colloquio === todayStr) await sendPush(profile, t.secCollOggiT, t.secCollOggiB)
      
      if (daysSince === 7 && ['In attesa risposta','Inviata','Vista'].includes(c.stato) && !c.notifica_7gg_inviata) {
        await sendPush(profile, t.week7T, t.week7B)
        await supabase.from('candidature').update({ notifica_7gg_inviata: true }).eq('id', c.id)
      }
      if (daysSince === 14 && ['In attesa risposta','Inviata','Vista'].includes(c.stato) && !c.notifica_14gg_inviata) {
        await sendPush(profile, t.week14T, t.week14B)
        await supabase.from('candidature').update({ notifica_14gg_inviata: true }).eq('id', c.id)
      }
      if (c.stato === 'Offerta ricevuta' && c.offerta_scadenza === tomorrowStr) await sendPush(profile, t.offScadT, t.offScadB)
      if (c.reminder_date === todayStr) await sendPush(profile, t.remT, t.remB)
    }

    // --- NOTIFICHE INATTIVITÀ ---
    if (profile.ultimo_accesso) {
      const inactiveDays = Math.floor((today - new Date(profile.ultimo_accesso)) / (1000 * 60 * 60 * 24))
      const attive = cands?.filter(c => ['Colloquio','Prima call','In attesa risposta','Secondo colloquio','Offerta ricevuta'].includes(c.stato)).length || 0
      
      if (inactiveDays === 3) {
        const title = lang === 'en' ? `💜 Everything okay${profile.nome ? `, ${profile.nome}` : ''}?` : `💜 Tutto ok${profile.nome ? `, ${profile.nome}` : ''}?`;
        const body = lang === 'en' 
          ? (attive > 0 ? `How is the search going? You have ${attive} ongoing applications — I'm with you! 🤗` : `How is the search going? I'm here if you need help. Keep me posted! 🤗`)
          : (attive > 0 ? `Come procede la ricerca? Hai ${attive} candidature in corso — ti sono vicin*! 🤗` : `Come procede la ricerca? Sono qui se hai bisogno. Tienimi aggiornato! 🤗`);
        await sendPush(profile, title, body)
      }
      if (inactiveDays === 7) {
        const title = lang === 'en' ? '👋 Welcome back to the hunt!' : '👋 Bentornat* nella ricerca!';
        const body = lang === 'en'
          ? (attive > 0 ? `You have ${attive} active applications waiting for updates. 💪` : 'Time to add some new applications. Don\'t give up! 💜')
          : (attive > 0 ? `Hai ${attive} candidature attive che aspettano aggiornamenti. 💪` : 'È ora di aggiungere nuove candidature. Non mollare! 💜');
        await sendPush(profile, title, body)
      }
    }
  }

  return res.status(200).json({ sent, errors: errors.length })
}