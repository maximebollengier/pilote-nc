import Mesure from "@/server/mesures/domain/Mesure.interface";
import { StatutMesure } from "@/server/mesures/domain/StatutMesure";
import { MesurePrioritaire } from "@/server/mesures/domain/MesurePrioritaire";
import { PhaseMesure } from "@/server/mesures/domain/PhaseMesure";

export default interface MesureRepository {
  créer(donnees: {
    code: string;
    titre: string;
    description: string | null;
    secteurId: string;
    coPorteurIds: string[];
    mesurePrioritaire: MesurePrioritaire;
    phase: PhaseMesure;
    auteurCreationId: string;
  }): Promise<Mesure>;
  lister(): Promise<Mesure[]>;
  récupérerParId(id: string): Promise<Mesure | null>;
  modifier(donnees: {
    id: string;
    code: string;
    titre: string;
    secteurId: string;
    coPorteurIds: string[];
    mesurePrioritaire: MesurePrioritaire;
    auteurModificationId: string;
  }): Promise<Mesure>;
  modifierStatut(donnees: {
    id: string;
    statut: StatutMesure;
    auteurModificationId: string;
  }): Promise<Mesure>;
  modifierPhase(donnees: {
    id: string;
    phase: PhaseMesure;
    auteurModificationId: string;
  }): Promise<Mesure>;
  recalculerMeteo(mesureId: string): Promise<void>;
  compterParSecteur(secteurId: string): Promise<number>;
}
