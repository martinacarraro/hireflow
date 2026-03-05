import { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import {
  XpBar, LevelBadge, SectionLabel, ConfirmDialog
} from '../components/UI'
import { BADGES, MOTTOS } from '../lib/utils'

export default function Profile() {
  const { profile, updateProfile, notifications, markAllNotificationsRead,
    unreadCount, refreshMotto, requestNotificationPermission } = useApp()
  const { user, signOut } = useAuth()
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [editBio, setEditBio] = useState(false)
  const [bio, setBio] = useState(profile?.bio_lavoro || '')

  const nome = profile?.nome || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Utente'
  const foto = user?.user_metadata?.avatar_url
  const xp = profile?.xp_points || 0
  const earned = (profile?.badge_lista || '').split(',').filter(Boolean)
  const streak = profile?.streak_giorni || 0
  const motto = MOTTOS[profile?.motto_index ?? 0]

  const handleSignOut = async () => { await signOut() }

  const Toggle = ({ value, onChange, label, sub }) => (
    <div className="flex items-center justify-between py-2.5">
      <div>
        <p className="text-sm font-medium text-txt">{label}</p>
        {sub && <p className="text-xs text-muted">{sub}</p>}
      </div>
      <button onClick={() => onChange(!value)}
        className={`w-12 h-6 rounded-full transition-all duration-200 relative flex-shrink-0
          ${value ? 'bg-purple' : 'bg-border'}`}>
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200
          ${value ? 'left-[26px]' : 'left-0.5'}`} />
      </button>
    </div>
  )

  if (showNotifs) {
    return (
      <div className="screen">
        <div className="flex items-center gap-3 px-5 pt-safe pt-4 pb-3 border-b border-border flex-shrink-0">
          <button onClick={() => setShowNotifs(false)} className="text-muted text-lg">←</button>
          <h2 className="font-bold text-txt">Le tue notifiche 🔔</h2>
          {unreadCount > 0 && (
            <button onClick={markAllNotificationsRead}
              className="ml-auto text-xs text-purple-soft">
              Segna tutto come letto
            </button>
          )}
        </div>
        <div className="flex-1 scrollable px-4 py-4">
          {notifications.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">🔕</div>
              <p className="text-muted text-sm">Nessuna notifica ancora.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map(n => (
                <div key={n.id}
                  className={`card flex items-start gap-3 ${!n.read ? 'border-purple/30' : ''}`}>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-purple mt-1.5 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${n.read ? 'text-muted' : 'text-txt'}`}>{n.title}</p>
                    <p className="text-xs text-muted mt-0.5">{n.body}</p>
                    <p className="text-[10px] text-disabled mt-1">
                      {new Date(n.time).toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="px-5 pt-safe pt-4 pb-2 flex-shrink-0">
        <h2 className="text-xl font-bold text-txt">Profilo 👤</h2>
      </div>

      <div className="flex-1 scrollable px-4 pb-8 space-y-4">

        {/* User header */}
        <div className="card flex items-center gap-4">
          {foto ? (
            <img src={foto} alt={nome} className="w-16 h-16 rounded-full ring-2 ring-purple object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-purple ring-2 ring-purple/50 flex items-center justify-center
              text-white text-2xl font-bold">
              {nome.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-txt text-lg">{nome}</p>
            <p className="text-xs text-muted truncate">{user?.email}</p>
            {editBio ? (
              <div className="mt-2 flex gap-2">
                <input className="input-field text-xs py-1 flex-1"
                  value={bio} onChange={e => setBio(e.target.value)}
                  placeholder="Es: UX Designer a Milano 🎨" />
                <button onClick={() => { updateProfile({ bio_lavoro: bio }); setEditBio(false) }}
                  className="text-purple-soft text-xs font-medium">✓</button>
              </div>
            ) : (
              <button onClick={() => setEditBio(true)} className="text-left">
                <p className="text-sm text-purple-soft italic mt-0.5">
                  {profile?.bio_lavoro || 'Aggiungi una bio... ✏️'}
                </p>
              </button>
            )}
          </div>
        </div>

        {/* Level & XP */}
        <div className="card">
          <SectionLabel>IL TUO LIVELLO ⭐</SectionLabel>
          <XpBar xp={xp} />
          <div className="flex items-center gap-4 mt-3">
            {streak > 1 && (
              <div className="flex items-center gap-1.5">
                <span className="text-lg animate-streak">🔥</span>
                <div>
                  <p className="text-sm font-bold text-amber">{streak}</p>
                  <p className="text-[10px] text-muted">giorni di fila</p>
                </div>
              </div>
            )}
            <div className="text-right ml-auto">
              <p className="text-lg font-bold text-gold">{xp}</p>
              <p className="text-[10px] text-muted">XP totali</p>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="card">
          <SectionLabel>I TUOI BADGE 🏅</SectionLabel>
          <p className="text-xs text-muted mb-3">{earned.length}/{BADGES.length} sbloccati</p>
          <div className="grid grid-cols-4 gap-2">
            {BADGES.map(badge => {
              const isEarned = earned.includes(badge.id)
              return (
                <div key={badge.id}
                  className={`flex flex-col items-center text-center p-2 rounded-xl border transition-all
                    ${isEarned ? 'bg-purple/10 border-purple/30' : 'bg-surface border-border opacity-40'}`}>
                  <span className="text-2xl mb-1">{isEarned ? badge.emoji : '🔒'}</span>
                  <p className="text-[9px] text-muted leading-tight">
                    {isEarned ? badge.name : '???'}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Motto */}
        <div className="card border-l-[3px] border-l-purple">
          <SectionLabel>IL TUO MOTTO 💜</SectionLabel>
          <p className="text-sm italic text-purple-soft mb-3 leading-relaxed">"{motto}"</p>
          <button onClick={refreshMotto}
            className="text-xs text-muted border border-border rounded-full px-3 py-1.5 active:scale-95">
            🔄 Cambia frase
          </button>
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>PREFERENZE 🔔</SectionLabel>
            <button onClick={() => setShowNotifs(true)}
              className="text-xs text-purple-soft flex items-center gap-1">
              Storico {unreadCount > 0 && (
                <span className="bg-red text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
          <Toggle
            value={profile?.notifiche_push_globali ?? true}
            onChange={v => {
              if (v) requestNotificationPermission()
              updateProfile({ notifiche_push_globali: v })
            }}
            label="🔔 Notifiche push"
            sub="Promemoria colloqui, ghosting, streak"
          />
          <div className="border-t border-border pt-2.5 mt-1">
            <p className="text-xs text-muted mb-2">📅 Riepilogo settimanale</p>
            <div className="flex gap-2">
              {['Lunedì','Venerdì','Entrambi'].map(g => (
                <button key={g} onClick={() => updateProfile({ recap_giorno: g })}
                  className={`pill-btn text-xs flex-1 ${
                    profile?.recap_giorno === g
                      ? 'bg-purple border-purple text-white'
                      : 'border-border text-muted'
                  }`}>
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="card space-y-2">
          <SectionLabel>SUPPORTO</SectionLabel>
          <a href="mailto:feedback@lemiecandidature.app"
            className="flex items-center gap-2 py-2 text-sm text-txt active:text-muted">
            💬 Dai il tuo feedback
          </a>
          <div className="border-t border-border" />
          <p className="text-xs text-disabled text-center pt-1">
            Le mie Candidature v1.0 — Fatto con 💜 per tutti i job hunter italiani
          </p>
        </div>

        {/* Sign out */}
        <button onClick={() => setConfirmSignOut(true)}
          className="btn-danger w-full py-3">
          Esci dall'account
        </button>
      </div>

      <ConfirmDialog
        isOpen={confirmSignOut}
        title="Esci dall'account"
        message="Sicura? I tuoi dati saranno al sicuro e potrai rientrare quando vuoi."
        onConfirm={handleSignOut}
        onCancel={() => setConfirmSignOut(false)}
      />
    </div>
  )
}
