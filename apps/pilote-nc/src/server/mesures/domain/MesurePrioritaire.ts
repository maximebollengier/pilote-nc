import { $Enums } from "@/database/generated/prisma-client";

export const MesurePrioritaire = $Enums.MesurePrioritaire;
export type MesurePrioritaire = $Enums.MesurePrioritaire;

// Ordre d'affichage = ordre de priorité politique donné par le gouvernement.
// NON_PRIORITAIRE (catch-all) est volontairement affiché en dernier.
export const ORDRE_MESURE_PRIORITAIRE: MesurePrioritaire[] = [
  "MAITRISE_DEPENSES_PUBLIQUES_ET_EXEMPLARITE",
  "SAUVEGARDE_REGIMES_SOCIAUX",
  "REFORME_RETRAITES_SECTEUR_PRIVE",
  "FISCALITE_ET_RELANCE_ECONOMIQUE",
  "POUVOIR_ACHAT_ET_URGENCE_SOCIALE",
  "NON_PRIORITAIRE",
];

export const LIBELLES_MESURE_PRIORITAIRE: Record<MesurePrioritaire, string> = {
  MAITRISE_DEPENSES_PUBLIQUES_ET_EXEMPLARITE:
    "Maîtrise des dépenses publiques et exemplarité",
  SAUVEGARDE_REGIMES_SOCIAUX: "Sauvegarde des régimes sociaux",
  REFORME_RETRAITES_SECTEUR_PRIVE: "Réforme des retraites du secteur privé",
  FISCALITE_ET_RELANCE_ECONOMIQUE: "Fiscalité et relance économique",
  POUVOIR_ACHAT_ET_URGENCE_SOCIALE: "Pouvoir d'achat et urgence sociale",
  NON_PRIORITAIRE: "Mesure non prioritaire",
};
