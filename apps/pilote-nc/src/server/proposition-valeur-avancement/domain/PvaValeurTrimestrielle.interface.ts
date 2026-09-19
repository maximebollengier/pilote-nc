import { StatutPva } from "@/server/proposition-valeur-avancement/domain/StatutPva";

export default interface PvaValeurTrimestrielle {
  id: string;
  indicateurId: string;
  annee: number;
  trimestre: number;
  valeurProposee: number;
  valeurValidee: number | null;
  statut: StatutPva;
  motifRefus: string | null;
  commentaireSg: string | null;
  soumisParId: string;
  dateSoumission: Date;
  traiteParId: string | null;
  dateTraitement: Date | null;
}

export interface PvaEnAttente extends PvaValeurTrimestrielle {
  indicateurNom: string;
  mesureId: string;
  mesureTitre: string;
  secteurId: string;
}

export interface PvaEvenement {
  id: string;
  type: string;
  valeur: number | null;
  commentaire: string | null;
  auteurId: string;
  createdAt: Date;
}
