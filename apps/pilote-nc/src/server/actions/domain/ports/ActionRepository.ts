import Action, { ActionAvecMesure } from "@/server/actions/domain/Action.interface";
import { TypeAction } from "@/server/actions/domain/TypeAction";

export default interface ActionRepository {
  créer(donnees: {
    mesureId: string;
    titre: string;
    type: TypeAction;
    dateEcheance: Date | null;
    datePrevisionnelleDebut: Date | null;
    datePrevisionnelleFin: Date | null;
    auteurCreationId: string;
  }): Promise<Action>;
  listerParMesure(mesureId: string): Promise<Action[]>;
  listerToutes(): Promise<ActionAvecMesure[]>;
  récupérerParId(id: string): Promise<Action | null>;
  récupérerScopeParId(
    id: string,
  ): Promise<{ mesureId: string; secteurId: string } | null>;
  saisirAvancement(donnees: {
    id: string;
    tauxAvancement: number;
    auteurModificationId: string;
  }): Promise<Action>;
  modifierDatesPrevisionnelles(donnees: {
    id: string;
    datePrevisionnelleDebut: Date | null;
    datePrevisionnelleFin: Date | null;
    auteurModificationId: string;
  }): Promise<Action>;
  définirBlocage(donnees: {
    id: string;
    bloquee: boolean;
    raisonBlocage: string | null;
    precisionArbitrage: string | null;
    auteurModificationId: string;
  }): Promise<Action>;
  supprimer(donnees: { id: string; auteurModificationId: string }): Promise<void>;
}
