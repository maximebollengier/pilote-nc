import { TypeAction } from "@/server/actions/domain/TypeAction";
import { MesurePrioritaire } from "@/server/mesures/domain/MesurePrioritaire";

export default interface Action {
  id: string;
  mesureId: string;
  titre: string;
  type: TypeAction;
  tauxAvancement: number;
  dateMajTauxAvancement: Date | null;
  dateEcheance: Date | null;
  datePrevisionnelleDebut: Date | null;
  datePrevisionnelleFin: Date | null;
  bloquee: boolean;
  raisonBlocage: string | null;
  precisionArbitrage: string | null;
}

export interface ActionAvecMesure extends Action {
  mesureTitre: string;
  secteurId: string;
  mesurePrioritaire: MesurePrioritaire;
}
