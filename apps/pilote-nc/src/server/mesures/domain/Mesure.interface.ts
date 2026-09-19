import { StatutMesure } from "@/server/mesures/domain/StatutMesure";
import { MesurePrioritaire } from "@/server/mesures/domain/MesurePrioritaire";
import { PhaseMesure } from "@/server/mesures/domain/PhaseMesure";

export default interface Mesure {
  id: string;
  code: string;
  titre: string;
  description: string | null;
  secteurId: string;
  coPorteurIds: string[];
  mesurePrioritaire: MesurePrioritaire;
  statut: StatutMesure;
  phase: PhaseMesure;
  datePrevisionnelleDebut: Date | null;
  datePrevisionnelleFin: Date | null;
  dateActee: Date | null;
  dateAchevement: Date | null;
  meteoAvancement: number | null;
  dateCalculMeteo: Date | null;
  tauxAvancementIndicateurs: number | null;
  nombreIndicateurs: number;
}
