import ActionRepository from "@/server/actions/domain/ports/ActionRepository";
import Action from "@/server/actions/domain/Action.interface";
import { Transaction } from "@/server/db/Transaction";
import { NotFoundError } from "@/server/app/error-boundary/not-found-error";
import { BadRequestError } from "@/server/app/error-boundary/bad-request-error";
import RecalculerMeteoMesureUseCase from "@/server/mesures/usecases/RecalculerMeteoMesureUseCase";

export default class SaisirAvancementActionUseCase {
  constructor(
    private readonly dependencies: {
      actionRepository: ActionRepository;
      recalculerMeteoMesureUseCase: RecalculerMeteoMesureUseCase;
      transaction: Transaction;
    },
  ) {}

  async run(input: {
    id: string;
    tauxAvancement: number;
    auteurModificationId: string;
  }): Promise<Action> {
    if (input.tauxAvancement < 0 || input.tauxAvancement > 100) {
      throw new BadRequestError(
        "Le taux d'avancement doit être compris entre 0 et 100",
      );
    }

    const action = await this.dependencies.actionRepository.récupérerParId(
      input.id,
    );
    if (!action) {
      throw new NotFoundError("Action introuvable");
    }

    return this.dependencies.transaction.run(async () => {
      const actionMiseAJour =
        await this.dependencies.actionRepository.saisirAvancement(input);
      await this.dependencies.recalculerMeteoMesureUseCase.run(
        action.mesureId,
      );
      return actionMiseAJour;
    });
  }
}
