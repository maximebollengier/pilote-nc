import PvaRepository from "@/server/proposition-valeur-avancement/domain/ports/PvaRepository";
import PvaValeurTrimestrielle from "@/server/proposition-valeur-avancement/domain/PvaValeurTrimestrielle.interface";
import { StatutPva } from "@/server/proposition-valeur-avancement/domain/StatutPva";
import { BadRequestError } from "@/server/app/error-boundary/bad-request-error";
import { NotFoundError } from "@/server/app/error-boundary/not-found-error";
import { Transaction } from "@/server/db/Transaction";
import IndicateurImpactRepository from "@/server/indicateurs-impact/domain/ports/IndicateurImpactRepository";
import { calculerTauxRealisation } from "@/server/indicateurs-impact/domain/calculerTauxRealisation";

export default class ModifierValeurValideePvaUseCase {
  constructor(
    private readonly dependencies: {
      pvaRepository: PvaRepository;
      indicateurImpactRepository: IndicateurImpactRepository;
      transaction: Transaction;
    },
  ) {}

  async run(input: {
    pvaId: string;
    valeurValidee: number;
    commentaireSg: string | null;
    traiteParId: string;
  }): Promise<PvaValeurTrimestrielle> {
    const pva = await this.dependencies.pvaRepository.récupérerParId(
      input.pvaId,
    );
    if (!pva) throw new NotFoundError("Proposition introuvable");
    if (
      pva.statut !== StatutPva.VALIDEE &&
      pva.statut !== StatutPva.VALIDEE_AVEC_MODIFICATION
    ) {
      throw new BadRequestError(
        "Seul un résultat trimestriel déjà validé peut être corrigé",
      );
    }

    return this.dependencies.transaction.run(async () => {
      const pvaModifiee =
        await this.dependencies.pvaRepository.modifierValeurValidee({
          id: input.pvaId,
          valeurValidee: input.valeurValidee,
          commentaireSg: input.commentaireSg,
          traiteParId: input.traiteParId,
        });

      // La valeur actuelle dénormalisée de l'indicateur ne reflète que le
      // trimestre validé le plus récent : on ne la resynchronise que si
      // c'est précisément celui qu'on vient de corriger, pour ne pas faire
      // régresser l'indicateur avec une correction sur un trimestre plus
      // ancien.
      const tousLesPva = await this.dependencies.pvaRepository.listerParIndicateur(
        pva.indicateurId,
      );
      const plusRecentValide = [...tousLesPva]
        .filter(
          (candidat) =>
            candidat.statut === StatutPva.VALIDEE ||
            candidat.statut === StatutPva.VALIDEE_AVEC_MODIFICATION,
        )
        .sort((a, b) => a.annee * 10 + a.trimestre - (b.annee * 10 + b.trimestre))
        .at(-1);

      if (plusRecentValide?.id === input.pvaId) {
        const indicateur =
          await this.dependencies.indicateurImpactRepository.récupérerParId(
            pva.indicateurId,
          );
        if (indicateur) {
          const tauxRealisation = calculerTauxRealisation({
            valeurInitiale: indicateur.valeurInitiale,
            valeurCible: indicateur.valeurCible,
            valeurActuelle: input.valeurValidee,
            sensEvolution: indicateur.sensEvolution,
          });

          await this.dependencies.indicateurImpactRepository.mettreAJourValeurActuelle(
            {
              id: indicateur.id,
              valeurActuelle: input.valeurValidee,
              dateValeurActuelle: new Date(),
              tauxRealisation,
            },
          );
        }
      }

      return pvaModifiee;
    });
  }
}
