import PvaRepository from "@/server/proposition-valeur-avancement/domain/ports/PvaRepository";
import PvaValeurTrimestrielle from "@/server/proposition-valeur-avancement/domain/PvaValeurTrimestrielle.interface";
import { StatutPva, TypeEvenementPva } from "@/server/proposition-valeur-avancement/domain/StatutPva";
import { BadRequestError } from "@/server/app/error-boundary/bad-request-error";
import { NotFoundError } from "@/server/app/error-boundary/not-found-error";
import { Transaction } from "@/server/db/Transaction";
import IndicateurImpactRepository from "@/server/indicateurs-impact/domain/ports/IndicateurImpactRepository";
import { calculerTauxRealisation } from "@/server/indicateurs-impact/domain/calculerTauxRealisation";

export default class ValiderAvecModificationPvaUseCase {
  constructor(
    private readonly dependencies: {
      pvaRepository: PvaRepository;
      indicateurImpactRepository: IndicateurImpactRepository;
      transaction: Transaction;
    },
  ) {}

  async run(input: {
    pvaId: string;
    valeurCorrigee: number;
    traiteParId: string;
    commentaireSg: string | null;
  }): Promise<PvaValeurTrimestrielle> {
    const pva = await this.dependencies.pvaRepository.récupérerParId(
      input.pvaId,
    );
    if (!pva) throw new NotFoundError("Proposition introuvable");
    if (pva.statut !== StatutPva.EN_ATTENTE_VALIDATION_SG) {
      throw new BadRequestError(
        "Cette proposition n'est plus en attente de validation",
      );
    }

    const indicateur =
      await this.dependencies.indicateurImpactRepository.récupérerParId(
        pva.indicateurId,
      );
    if (!indicateur) throw new NotFoundError("Indicateur introuvable");

    return this.dependencies.transaction.run(async () => {
      const dateValeurActuelle = new Date();
      const tauxRealisation = calculerTauxRealisation({
        valeurInitiale: indicateur.valeurInitiale,
        valeurCible: indicateur.valeurCible,
        valeurActuelle: input.valeurCorrigee,
        sensEvolution: indicateur.sensEvolution,
      });

      await this.dependencies.indicateurImpactRepository.mettreAJourValeurActuelle(
        {
          id: indicateur.id,
          valeurActuelle: input.valeurCorrigee,
          dateValeurActuelle,
          tauxRealisation,
        },
      );

      const pvaDecidee = await this.dependencies.pvaRepository.décider({
        id: pva.id,
        statut: StatutPva.VALIDEE_AVEC_MODIFICATION,
        valeurValidee: input.valeurCorrigee,
        motifRefus: null,
        commentaireSg: input.commentaireSg,
        traiteParId: input.traiteParId,
      });

      await this.dependencies.pvaRepository.ajouterEvenement({
        pvaId: pva.id,
        type: TypeEvenementPva.MODIFIEE_PAR_SG,
        valeur: input.valeurCorrigee,
        commentaire: input.commentaireSg,
        auteurId: input.traiteParId,
      });

      return pvaDecidee;
    });
  }
}
