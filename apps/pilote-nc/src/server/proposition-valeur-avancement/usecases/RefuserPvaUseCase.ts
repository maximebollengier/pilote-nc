import PvaRepository from "@/server/proposition-valeur-avancement/domain/ports/PvaRepository";
import PvaValeurTrimestrielle from "@/server/proposition-valeur-avancement/domain/PvaValeurTrimestrielle.interface";
import { StatutPva, TypeEvenementPva } from "@/server/proposition-valeur-avancement/domain/StatutPva";
import { BadRequestError } from "@/server/app/error-boundary/bad-request-error";
import { NotFoundError } from "@/server/app/error-boundary/not-found-error";
import { Transaction } from "@/server/db/Transaction";

export default class RefuserPvaUseCase {
  constructor(
    private readonly dependencies: {
      pvaRepository: PvaRepository;
      transaction: Transaction;
    },
  ) {}

  async run(input: {
    pvaId: string;
    motifRefus: string;
    traiteParId: string;
  }): Promise<PvaValeurTrimestrielle> {
    // Le motif est exigé par la spec sur un refus (contrairement à la
    // validation, où le commentaire SG reste facultatif). Revalidé ici même
    // si le tRPC route + Zod le valident déjà côté transport, pour que
    // l'usecase reste correct appelé depuis n'importe quel contexte.
    if (input.motifRefus.trim().length === 0) {
      throw new BadRequestError("Le motif de refus est obligatoire");
    }

    const pva = await this.dependencies.pvaRepository.récupérerParId(
      input.pvaId,
    );
    if (!pva) throw new NotFoundError("Proposition introuvable");
    if (pva.statut !== StatutPva.EN_ATTENTE_VALIDATION_SG) {
      throw new BadRequestError(
        "Cette proposition n'est plus en attente de validation",
      );
    }

    return this.dependencies.transaction.run(async () => {
      const pvaDecidee = await this.dependencies.pvaRepository.décider({
        id: pva.id,
        statut: StatutPva.REFUSEE,
        valeurValidee: null,
        motifRefus: input.motifRefus,
        commentaireSg: null,
        traiteParId: input.traiteParId,
      });

      await this.dependencies.pvaRepository.ajouterEvenement({
        pvaId: pva.id,
        type: TypeEvenementPva.REFUSEE,
        valeur: null,
        commentaire: input.motifRefus,
        auteurId: input.traiteParId,
      });

      return pvaDecidee;
    });
  }
}
