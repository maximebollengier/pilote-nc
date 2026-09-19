import { $Enums } from "@/database/generated/prisma-client";
import { ProfilEnum } from "@/server/app/enum/profil.enum";

export const ActionDroit = $Enums.ActionDroit;
export type ActionDroit = $Enums.ActionDroit;

export const ORDRE_ACTION_DROIT: ActionDroit[] = [
  "MESURE_CREER",
  "MESURE_MODIFIER",
  "MESURE_MODIFIER_STATUT",
  "MESURE_MODIFIER_PHASE",
  "ACTION_CREER",
  "ACTION_MODIFIER",
  "ACTION_SUPPRIMER",
  "INDICATEUR_CREER",
];

export const LIBELLES_ACTION_DROIT: Record<ActionDroit, string> = {
  MESURE_CREER: "Créer une mesure",
  MESURE_MODIFIER: "Modifier une mesure",
  MESURE_MODIFIER_STATUT: "Modifier le statut d'une mesure",
  MESURE_MODIFIER_PHASE: "Modifier la phase d'une mesure",
  ACTION_CREER: "Créer une action",
  ACTION_MODIFIER: "Modifier une action (avancement, dates, blocage)",
  ACTION_SUPPRIMER: "Supprimer une action",
  INDICATEUR_CREER: "Ajouter un indicateur d'impact",
};

// Comportement d'origine (avant l'introduction de la matrice configurable),
// utilisé tant qu'aucune ligne de surcharge n'existe en base pour la
// combinaison (action, profil) — cf. estAutorise.ts.
export const DROITS_PAR_DEFAUT: Record<ActionDroit, ProfilEnum[]> = {
  MESURE_CREER: [ProfilEnum.ADMIN_OUTIL, ProfilEnum.PRESIDENT],
  MESURE_MODIFIER: [ProfilEnum.ADMIN_OUTIL, ProfilEnum.PRESIDENT],
  MESURE_MODIFIER_STATUT: [ProfilEnum.ADMIN_OUTIL, ProfilEnum.PRESIDENT],
  MESURE_MODIFIER_PHASE: [ProfilEnum.ADMIN_OUTIL, ProfilEnum.PRESIDENT],
  ACTION_CREER: [
    ProfilEnum.ADMIN_OUTIL,
    ProfilEnum.SECRETARIAT_GENERAL,
    ProfilEnum.DIRECTION_NC,
  ],
  ACTION_MODIFIER: [
    ProfilEnum.ADMIN_OUTIL,
    ProfilEnum.SECRETARIAT_GENERAL,
    ProfilEnum.DIRECTION_NC,
  ],
  ACTION_SUPPRIMER: [
    ProfilEnum.ADMIN_OUTIL,
    ProfilEnum.SECRETARIAT_GENERAL,
    ProfilEnum.DIRECTION_NC,
  ],
  INDICATEUR_CREER: [ProfilEnum.ADMIN_OUTIL],
};

// Actions pour lesquelles DIRECTION_NC reste, quoi qu'il arrive, restreint
// aux mesures de ses secteurs habilités : ce n'est pas une case de la
// matrice (ce n'est pas un choix admin), mais une règle métier structurelle.
export const ACTIONS_SCOPEES_PAR_SECTEUR: ActionDroit[] = [
  "ACTION_CREER",
  "ACTION_MODIFIER",
  "ACTION_SUPPRIMER",
];
