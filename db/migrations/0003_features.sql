-- 0003_features — offrande quotidienne, état applicatif, panthéon des saisons,
-- et perks offensifs (malédiction de pseudo, bouclier anti-roast).

-- Offrande quotidienne : dernier claim + série en cours.
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_claim_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS claim_streak INT NOT NULL DEFAULT 0;

-- Petit état applicatif clé/valeur (pluie de météorites en cours, dernière
-- saison traitée…). Survit aux redémarrages, contrairement à la mémoire.
CREATE TABLE IF NOT EXISTS app_state (
    key        TEXT PRIMARY KEY,
    value      JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Panthéon : le vainqueur hebdomadaire (poussière GAGNÉE sur la semaine).
CREATE TABLE IF NOT EXISTS hall_of_fame (
    season     TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL,
    earned     BIGINT NOT NULL,
    crowned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Perks offensifs / défensifs v2.
INSERT INTO shop_items (id, name, cost, type, config) VALUES
  (
    'nickname_curse',
    'Malédiction du pseudo (1 heure)',
    600,
    'nickname_curse',
    '{
      "description": "Rebaptise un autre membre pendant 1 heure. Le Caillou restaure son pseudo ensuite — la honte, elle, reste. Sans effet sur les porteurs du Bouclier de basalte.",
      "durationMs": 3600000,
      "needsValue": true,
      "needsTarget": true
    }'::jsonb
  ),
  (
    'roast_immunity',
    'Bouclier de basalte (24 heures)',
    350,
    'roast_immunity',
    '{
      "description": "24 heures d''immunité contre /roast et la Malédiction du pseudo. Le Caillou trouve ça lâche, mais il encaisse la poussière.",
      "durationMs": 86400000
    }'::jsonb
  )
ON CONFLICT (id) DO NOTHING;
