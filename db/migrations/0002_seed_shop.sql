-- 0002_seed_shop — articles de la boutique v1.
-- `config.description` est affichée par /boutique. Les coûts restent ajustables
-- en base par un admin (ON CONFLICT DO NOTHING ne les écrase pas au re-seed).
-- Les IDs Discord NE sont PAS stockés ici : `config.roleEnvKey` pointe vers la
-- variable d'environnement qui les contient.

INSERT INTO shop_items (id, name, cost, type, config) VALUES
  (
    'color_role',
    'Rôle de couleur (7 jours)',
    250,
    'color_role',
    '{
      "description": "Un rôle coloré rien que pour toi. S''auto-désintègre au bout de 7 jours, comme toute gloire éphémère.",
      "durationMs": 604800000,
      "roleEnvKey": "COLOR_ROLE_ID"
    }'::jsonb
  ),
  (
    'prestige_role',
    'L''Élu du Caillou',
    5000,
    'prestige_role',
    '{
      "description": "Le titre suprême. Un seul élu à la fois — acheter, c''est détrôner le précédent. Tient 30 jours avant que le Caillou ne se lasse de toi.",
      "durationMs": 2592000000,
      "roleEnvKey": "PRESTIGE_ROLE_ID",
      "singleHolder": true
    }'::jsonb
  ),
  (
    'channel_rename',
    'Renommer un salon (1 heure)',
    400,
    'channel_rename',
    '{
      "description": "Rebaptise un salon autorisé pendant 1 heure. Le Caillou restaure le nom d''origine ensuite, évidemment.",
      "durationMs": 3600000,
      "needsValue": true,
      "needsChannel": true
    }'::jsonb
  ),
  (
    'bot_status',
    'Statut personnalisé du Caillou (1 heure)',
    300,
    'bot_status',
    '{
      "description": "Tu écris ce que le Caillou raconte être en train de faire, pendant 1 heure. Pure vanité.",
      "durationMs": 3600000,
      "needsValue": true
    }'::jsonb
  )
ON CONFLICT (id) DO NOTHING;
