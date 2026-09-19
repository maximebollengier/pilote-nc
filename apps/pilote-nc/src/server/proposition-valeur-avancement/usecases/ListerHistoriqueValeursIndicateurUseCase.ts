import PvaRepository from "@/server/proposition-valeur-avancement/domain/ports/PvaRepository";
import { StatutPva } from "@/server/proposition-valeur-avancement/domain/StatutPva";
import IndicateurImpactRepository from "@/server/indicateurs-impact/domain/ports/IndicateurImpactRepository";
import { calculerTauxRealisation } from "@/server/indicateurs-impact/domain/calculerTauxRealisation";
import { NotFoundError } from "@/server/app/error-boundary/not-found-error";

export type PointHistoriqueIndicateur = {
  pvaId: string;
  annee: number;
  trimestre: number;
  valeur: number;
  tauxRealisation: number | null;
  commentaireSg: string | null;
};

export default class ListerHistoriqueValeursIndicateurUseCase {
  constructor(
    private readonly dependencies: {
      pvaRepository: PvaRepository;
      indicateurImpactRepository: IndicateurImpactRepository;
    },
  ) {}

  async run(indicateurId: string): Promise<{
    indicateurNom: string;
    unite: string | null;
    points: PointHistoriqueIndicateur[];
  }> {
    const indicateur =
      await this.dependencies.indicateurImpactRepository.récupérerParId(
        indicateurId,
      );
    if (!indicateur) throw new NotFoundError("Indicateur introuvable");

    const pvas =
      await this.dependencies.pvaRepository.listerParIndicateur(indicateurId);

    const points = pvas
      .filter(
        (pva) =>
          pva.valeurValidee !== null &&
          (pva.statut === StatutPva.VALIDEE ||
            pva.statut === StatutPva.VALIDEE_AVEC_MODIFICATION),
      )
      .map((pva) => ({
        pvaId: pva.id,
        annee: pva.annee,
        trimestre: pva.trimestre,
        // Non-null : filtré juste au-dessus.
        valeur: pva.valeurValidee as number,
        tauxRealisation: calculerTauxRealisation({
          valeurInitiale: indicateur.valeurInitiale,
          valeurCible: indicateur.valeurCible,
          valeurActuelle: pva.valeurValidee,
          sensEvolution: indicateur.sensEvolution,
        }),
        commentaireSg: pva.commentaireSg,
      }));

    return {
      indicateurNom: indicateur.nom,
      unite: indicateur.unite,
      points,
    };
  }
}
