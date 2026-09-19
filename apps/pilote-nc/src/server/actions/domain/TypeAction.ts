import { $Enums } from "@/database/generated/prisma-client";

export const TypeAction = $Enums.TypeAction;
export type TypeAction = $Enums.TypeAction;

export const LIBELLES_TYPE_ACTION: Record<TypeAction, string> = {
  JURIDIQUE: "Juridique",
  COMMUNICATION: "Communication",
  BUDGETAIRE: "Budgétaire",
  ORGANISATIONNEL_RH: "Organisationnel / RH",
  TECHNIQUE_SI: "Technique / SI",
  TRAVAUX_AMENAGEMENT: "Travaux / Aménagement",
};
