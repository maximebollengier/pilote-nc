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
  /**
   * Supprime (au sens doux : `deletedAt`) la mesure ainsi que ses actions et
   * indicateurs d'impact — pas ses co-porteurs ni son secteur, qui n'en
   * dépendent pas. À appeler depuis un usecase qui ouvre la transaction
   * (cf. ModifierHabilitationsSecteurUseCase) pour que les trois écritures
   * soient atomiques.
   */
  supprimer(donnees: { id: string; auteurModificationId: string }): Promise<void>;
  recalculerMeteo(mesureId: string): Promise<void>;
  compterParSecteur(secteurId: string): Promise<number>;
}
