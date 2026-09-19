import IndicateurImpact from "@/server/indicateurs-impact/domain/IndicateurImpact.interface";
import { SensEvolution } from "@/server/indicateurs-impact/domain/SensEvolution";

export default interface IndicateurImpactRepository {
  créer(donnees: {
    mesureId: string;
    nom: string;
    unite: string | null;
    sensEvolution: SensEvolution;
    valeurInitiale: number;
    valeurCible: number;
    auteurCreationId: string;
  }): Promise<IndicateurImpact>;
  listerParMesure(mesureId: string): Promise<IndicateurImpact[]>;
  récupérerParId(id: string): Promise<IndicateurImpact | null>;
  récupérerScopeParId(
    id: string,
  ): Promise<{ mesureId: string; secteurId: string } | null>;
  mettreAJourValeurActuelle(donnees: {
    id: string;
    valeurActuelle: number;
    dateValeurActuelle: Date;
    tauxRealisation: number | null;
  }): Promise<void>;
}
