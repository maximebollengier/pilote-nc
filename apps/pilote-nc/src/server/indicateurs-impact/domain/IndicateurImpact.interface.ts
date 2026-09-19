import { SensEvolution } from "@/server/indicateurs-impact/domain/SensEvolution";

export default interface IndicateurImpact {
  id: string;
  mesureId: string;
  nom: string;
  unite: string | null;
  sensEvolution: SensEvolution;
  valeurInitiale: number;
  valeurCible: number;
  valeurActuelle: number | null;
  dateValeurActuelle: Date | null;
  tauxRealisation: number | null;
}
