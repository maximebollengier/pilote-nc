import { $Enums } from "@/database/generated/prisma-client";

export const StatutPva = $Enums.StatutPva;
export type StatutPva = $Enums.StatutPva;

export const TypeEvenementPva = $Enums.TypeEvenementPva;
export type TypeEvenementPva = $Enums.TypeEvenementPva;

export const LIBELLES_STATUT_PVA: Record<StatutPva, string> = {
  EN_ATTENTE_VALIDATION_SG: "En attente de validation SG",
  VALIDEE: "Validée",
  VALIDEE_AVEC_MODIFICATION: "Validée avec modification",
  REFUSEE: "Refusée",
};
