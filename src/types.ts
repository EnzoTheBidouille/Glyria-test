// Types partagés du domaine. Importés explicitement via `import type` là où
// nécessaire (les types ne passent pas par l'auto-import de glyria).

export type PerkType =
  | "color_role"
  | "prestige_role"
  | "channel_rename"
  | "bot_status";

/** Données statiques d'un article, stockées dans `shop_items.config` (jsonb). */
export interface ShopItemConfig {
  description: string;
  /** Durée de vie du perk en ms. `null` = pas d'expiration temporelle. */
  durationMs: number | null;
  /** Clé d'env contenant l'ID du rôle Discord à attribuer. */
  roleEnvKey?: string;
  /** Vrai pour un rôle à détenteur unique (ex. L'Élu du Caillou). */
  singleHolder?: boolean;
  /** Le perk exige une valeur texte (`valeur`) à l'achat. */
  needsValue?: boolean;
  /** Le perk exige le choix d'un salon (`salon`) à l'achat. */
  needsChannel?: boolean;
}

export interface ShopItem {
  id: string;
  name: string;
  cost: number;
  type: PerkType;
  config: ShopItemConfig;
  active: boolean;
}

/** Tout ce qu'il faut pour défaire un perk à son expiration / révocation. */
export interface PerkRevert {
  roleId?: string;
  channelId?: string;
  originalName?: string;
  /**
   * Valeur appliquée par le perk (nom de salon, texte de statut). Permet de
   * réappliquer le perk encore actif le plus récent quand un autre expire,
   * et de restaurer le statut payé après un redémarrage du bot.
   */
  appliedValue?: string;
}

export interface ActivePerk {
  id: number;
  userId: string;
  itemId: string;
  type: PerkType;
  grantedAt: Date;
  expiresAt: Date | null;
  revert: PerkRevert;
}

export interface LeaderboardEntry {
  discordId: string;
  balance: number;
}

/** Phrase pondérée du pool de personnalité (Tier 1). */
export interface Phrase {
  text: string;
  weight: number;
}

/** Paramètres d'un achat, communs à tous les types de perk. */
export interface PurchaseInput {
  userId: string;
  itemId: string;
  /** Valeur texte (nom de salon, ligne de statut…) si le perk l'exige. */
  value?: string;
  /** ID du salon ciblé (déjà validé contre la whitelist) si le perk l'exige. */
  channelId?: string;
}
