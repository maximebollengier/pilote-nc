import { MesurePrioritaire } from "@/server/mesures/domain/MesurePrioritaire";
import { StatutMesure } from "@/server/mesures/domain/StatutMesure";
import { PhaseMesure } from "@/server/mesures/domain/PhaseMesure";

export type MesureAffichage = {
  id: string;
  code: string;
  titre: string;
  secteurId: string;
  statut: StatutMesure;
  phase: PhaseMesure;
  mesurePrioritaire: MesurePrioritaire;
  meteoAvancement: number | null;
  tauxAvancementIndicateurs: number | null;
};
