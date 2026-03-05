# 🚀 Le mie Candidature — Setup Guide

App PWA installabile per tracciare candidature di lavoro.
Dark theme viola, gamificata, notifiche push, smart link parser.

---

## ⚡ SETUP IN 4 PASSI (15 minuti totali)

---

### PASSO 1 — Crea il database su Supabase (GRATIS)

1. Vai su **https://supabase.com** → Sign up (gratis)
2. Clicca **"New Project"**
3. Dai un nome al progetto (es: "candidature")
4. Scegli una password e la regione **"EU West"**
5. Aspetta ~2 minuti che il progetto si avvii
6. Vai su **SQL Editor** (icona database a sinistra)
7. Copia tutto il codice SQL che trovi nel file `src/lib/supabase.js`
   (è nella sezione commentata in fondo al file, tra /* e */)
8. Incollalo nell'editor e clicca **"Run"**
9. Vai su **Settings → API**
10. Copia **"Project URL"** e **"anon public key"**

---

### PASSO 2 — Configura l'autenticazione Google

1. Su Supabase → **Authentication → Providers → Google**
2. Abilita Google provider
3. Vai su **https://console.cloud.google.com**
4. Crea un progetto → API & Services → Credentials
5. Crea OAuth 2.0 Client ID → tipo "Web application"
6. Aggiungi in "Authorized redirect URIs":
   `https://TUOPROGETTO.supabase.co/auth/v1/callback`
7. Copia Client ID e Client Secret su Supabase

---

### PASSO 3 — Installa e avvia in locale

Assicurati di avere **Node.js** installato (https://nodejs.org).

```bash
# Entra nella cartella del progetto
cd candidature-app

# Copia il file di configurazione
cp .env.example .env

# Apri .env con un editor di testo e incolla i valori di Supabase:
# VITE_SUPABASE_URL=https://XXXXX.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJ...

# Installa le dipendenze
npm install

# Avvia in locale
npm run dev
```

Apri il browser su **http://localhost:3000** — l'app funziona! 🎉

---

### PASSO 4 — Deploy su Vercel (GRATIS, online per tutti)

1. Vai su **https://vercel.com** → Sign up con GitHub
2. Clicca **"New Project"**
3. Carica la cartella `candidature-app` oppure:
   - Carica il codice su GitHub
   - Vercel lo importa automaticamente
4. Aggiungi le **Environment Variables**:
   - `VITE_SUPABASE_URL` = il tuo URL Supabase
   - `VITE_SUPABASE_ANON_KEY` = la tua anon key
5. Clicca **Deploy** → aspetta 2 minuti
6. La tua app è online su `https://nomeprogetto.vercel.app`!

Aggiorna l'URL in Supabase → Authentication → URL Configuration:
- Site URL: `https://nomeprogetto.vercel.app`
- Redirect URLs: `https://nomeprogetto.vercel.app`

---

## 📱 INSTALLARE L'APP SUL TELEFONO

**iPhone (Safari):**
1. Apri il link su Safari
2. Tocca il tasto di condivisione 🔼
3. "Aggiungi alla schermata Home"
4. Ora funziona come un'app nativa!

**Android (Chrome):**
1. Apri il link su Chrome
2. Menu (3 punti) → "Aggiungi alla schermata Home"
3. Oppure Chrome mostra in automatico il banner "Installa"

---

## 🆓 COSTI

| Servizio | Piano | Costo |
|----------|-------|-------|
| Supabase | Free tier | **0€** (fino a 50.000 righe, 500MB) |
| Vercel   | Hobby plan | **0€** (illimitati deployment) |
| **TOTALE** | | **0€/mese** 🎉 |

Per crescere oltre i limiti free (migliaia di utenti):
- Supabase Pro: $25/mese
- Vercel Pro: $20/mese

---

## 📁 STRUTTURA PROGETTO

```
candidature-app/
├── src/
│   ├── screens/
│   │   ├── Splash.jsx       ← Loading con tips
│   │   ├── Login.jsx        ← Auth Google + Email
│   │   ├── Onboarding.jsx   ← 4 slide primo accesso
│   │   ├── Home.jsx         ← Lista raggruppata
│   │   ├── AddCandidatura.jsx ← Form con smart parser
│   │   ├── DetailView.jsx   ← Dettaglio + checklist
│   │   ├── Stats.jsx        ← Statistiche + charts
│   │   └── Profile.jsx      ← Profilo + badge + XP
│   ├── contexts/
│   │   ├── AuthContext.jsx  ← Login/logout
│   │   └── AppContext.jsx   ← Dati + notifiche + XP
│   ├── components/
│   │   └── UI.jsx           ← Componenti riutilizzabili
│   └── lib/
│       ├── supabase.js      ← Client + schema SQL
│       └── utils.js         ← Colori, tips, badge, XP
├── public/
│   ├── sw.js               ← Service worker push
│   └── manifest.json       ← PWA manifest
├── .env.example            ← Template variabili
└── README.md               ← Questa guida
```

---

## ✨ FUNZIONALITÀ INCLUSE

- 🔐 Auth Google + Email, dati privati per utente
- 📱 PWA installabile su telefono
- 🔗 Smart link parser (LinkedIn, Indeed, InfoJobs...)
- 📊 Stats con grafici, insights, Hall of Shame
- 🏆 XP, livelli, 14 badge sbloccabili
- 🔥 Streak giornaliero
- ✅ Checklist pre-colloquio (8 task auto-generati)
- 🔔 Notifiche push: pre-colloquio, post-colloquio, ghosting, inattività
- 💡 30 tips rotativi durante il caricamento
- 🎊 Confetti quando ottieni un'offerta!
- 👻 Auto-GHOSTED dopo 30 giorni senza risposta
- 🌍 Mappa integrata per trovare la sede

---

Fatto con 💜 — buona caccia al lavoro!
