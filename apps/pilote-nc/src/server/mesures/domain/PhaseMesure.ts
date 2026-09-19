import { $Enums } from "@/database/generated/prisma-client";

export const PhaseMesure = $Enums.PhaseMesure;
export type PhaseMesure = $Enums.PhaseMesure;

export const ORDRE_PHASE_MESURE: PhaseMesure[] = ["AN_1", "PLUS_TARD"];

export const LIBELLES_PHASE_MESURE: Record<PhaseMesure, string> = {
  AN_1: "An 1",
  PLUS_TARD: "Plus tard",
};
