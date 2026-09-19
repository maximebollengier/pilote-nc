import PvaRepository from "@/server/proposition-valeur-avancement/domain/ports/PvaRepository";
import PvaValeurTrimestrielle from "@/server/proposition-valeur-avancement/domain/PvaValeurTrimestrielle.interface";
import { StatutPva, TypeEvenementPva } from "@/server/proposition-valeur-avancement/domain/StatutPva";
import { ConflictError } from "@/server/app/error-boundary/conflict-error";
import { Transaction } from "@/server/db/Transaction";

export default class SoumettrePvaUseCase {
  constructor(
    private readonly dependencies: {
      pvaRepository: PvaRepository;
      transaction: Transaction;
    },
  ) {}

  async run(input: {
    indicateurId: string;
    annee: number;
    trimestre: number;
    valeurProposee: number;
    soumisParId: string;
  }): Promise<PvaValeurTrimestrielle> {
    const existant = await this.dependencies.pvaRepository.récupérerParCle({
      indicateurId: input.indicateurId,
      annee: input.annee,
      trimestre: input.trimestre,
    });

    if (existant && existant.statut !== StatutPva.REFUSEE) {
      throw new ConflictError(
        "Une proposition existe déjà pour ce trimestre et n'a pas été refusée",
      );
    }

    return this.dependencies.transaction.run(async () => {
      const pva = existant
        ? await this.dependencies.pvaRepository.réinitialiserPourResoumission({
            id: existant.id,
            valeurProposee: input.valeurProposee,
            soumisParId: input.soumisParId,
          })
        : await this.dependencies.pvaRepository.créer(input);

      await this.dependencies.pvaRepository.ajouterEvenement({
        pvaId: pva.id,
        type: TypeEvenementPva.SOUMISE,
        valeur: input.valeurProposee,
        commentaire: null,
        auteurId: input.soumisParId,
      });

      return pva;
    });
  }
}
