import { $Enums } from "@/database/generated/prisma-client";

export const StatutMesure = $Enums.StatutMesure;
export type StatutMesure = $Enums.StatutMesure;

export const ORDRE_STATUT_MESURE: StatutMesure[] = [
  "A_L_ETUDE",
  "ACTEE",
  "ABANDONNEE",
];

export const LIBELLES_STATUT_MESURE: Record<StatutMesure, string> = {
  A_L_ETUDE: "À l'étude",
  ACTEE: "Actée",
  ABANDONNEE: "Abandonnée",
};
