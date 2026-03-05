import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase env vars missing. Check your .env file.')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SUPABASE SQL SCHEMA
  Copia questo nel SQL Editor di Supabase
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Enable RLS
ALTER TABLE IF EXISTS candidature ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_profiles ENABLE ROW LEVEL SECURITY;

-- TABLE: candidature
CREATE TABLE IF NOT EXISTS candidature (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  azienda TEXT NOT NULL,
  ruolo TEXT NOT NULL,
  stato TEXT DEFAULT 'Inviata' CHECK (stato IN ('Inviata','Colloquio','In attesa','Offerta ricevuta','GHOSTED','Ritirata')),
  priorita TEXT DEFAULT 'Media' CHECK (priorita IN ('Alta','Media','Bassa')),
  sede TEXT,
  paese TEXT DEFAULT 'Italia',
  link_annuncio TEXT,
  fonte TEXT DEFAULT 'Altro',
  stipendio_min INTEGER,
  stipendio_max INTEGER,
  data_invio DATE DEFAULT CURRENT_DATE,
  data_colloquio DATE,
  ora_colloquio TIME,
  tipo_colloquio TEXT,
  contatto_hr TEXT,
  email_hr TEXT,
  note TEXT,
  domande_fatte TEXT,
  domande_mie TEXT,
  feeling TEXT,
  feeling_aggiornato BOOLEAN DEFAULT FALSE,
  notifiche_push BOOLEAN DEFAULT TRUE,
  notifica_7gg_inviata BOOLEAN DEFAULT FALSE,
  notifica_14gg_inviata BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: checklist_items
CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  candidatura_id UUID REFERENCES candidature(id) ON DELETE CASCADE NOT NULL,
  task TEXT NOT NULL,
  fatto BOOLEAN DEFAULT FALSE,
  ordine INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: user_profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome TEXT,
  bio_lavoro TEXT,
  settore TEXT,
  citta TEXT,
  seen_onboarding BOOLEAN DEFAULT FALSE,
  xp_points INTEGER DEFAULT 0,
  streak_giorni INTEGER DEFAULT 0,
  ultimo_accesso DATE,
  badge_lista TEXT DEFAULT '',
  motto_index INTEGER DEFAULT 1,
  notifiche_push_globali BOOLEAN DEFAULT TRUE,
  recap_giorno TEXT DEFAULT 'Venerdì',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES
CREATE POLICY "Users see own candidature" ON candidature FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own checklist" ON checklist_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own profile" ON user_profiles FOR ALL USING (auth.uid() = id);

-- AUTO-UPDATE updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER candidature_updated_at BEFORE UPDATE ON candidature FOR EACH ROW EXECUTE FUNCTION update_updated_at();

*/
