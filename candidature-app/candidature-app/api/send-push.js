// api/send-push.js — invia notifica push con libreria web-push ufficiale
import webpush from 'web-push'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { subscription, title, body, url = '/' } = req.body
  if (!subscription) return res.status(400).json({ error: 'No subscription' })

  const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY
  const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY
  const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:feedback@lefaremosapere.app'

  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return res.status(500).json({ error: 'VAPID keys not configured' })
  }

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({ title, body, url }),
    )
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Push error:', err)
    if (err.statusCode === 410 || err.statusCode === 404) {
      return res.status(410).json({ error: 'subscription_expired' })
    }
    return res.status(500).json({ error: err.message })
  }
}