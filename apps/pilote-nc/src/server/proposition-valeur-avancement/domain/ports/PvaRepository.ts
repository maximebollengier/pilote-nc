import PvaValeurTrimestrielle, {
  PvaEnAttente,
  PvaEvenement,
} from "@/server/proposition-valeur-avancement/domain/PvaValeurTrimestrielle.interface";
import { StatutPva } from "@/server/proposition-valeur-avancement/domain/StatutPva";

export default interface PvaRepository {
  récupérerParCle(donnees: {
    indicateurId: string;
    annee: number;
    trimestre: number;
  }): Promise<PvaValeurTrimestrielle | null>;

  récupérerParId(id: string): Promise<PvaValeurTrimestrielle | null>;

  créer(donnees: {
    indicateurId: string;
    annee: number;
    trimestre: number;
    valeurProposee: number;
    soumisParId: string;
  }): Promise<PvaValeurTrimestrielle>;

  réinitialiserPourResoumission(donnees: {
    id: string;
    valeurProposee: number;
    soumisParId: string;
  }): Promise<PvaValeurTrimestrielle>;

  listerEnAttente(): Promise<PvaEnAttente[]>;

  listerParIndicateur(indicateurId: string): Promise<PvaValeurTrimestrielle[]>;

  décider(donnees: {
    id: string;
    statut: StatutPva;
    valeurValidee: number | null;
    motifRefus: string | null;
    commentaireSg: string | null;
    traiteParId: string;
  }): Promise<PvaValeurTrimestrielle>;

  modifierValeurValidee(donnees: {
    id: string;
    valeurValidee: number;
    commentaireSg: string | null;
    traiteParId: string;
  }): Promise<PvaValeurTrimestrielle>;

  ajouterEvenement(donnees: {
    pvaId: string;
    type: "SOUMISE" | "MODIFIEE_PAR_SG" | "VALIDEE" | "REFUSEE";
    valeur: number | null;
    commentaire: string | null;
    auteurId: string;
  }): Promise<void>;

  récupérerHistorique(id: string): Promise<PvaEvenement[]>;
}
