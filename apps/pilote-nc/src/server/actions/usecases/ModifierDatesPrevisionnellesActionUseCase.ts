import ActionRepository from "@/server/actions/domain/ports/ActionRepository";
import Action from "@/server/actions/domain/Action.interface";

export default class ModifierDatesPrevisionnellesActionUseCase {
  constructor(
    private readonly dependencies: { actionRepository: ActionRepository },
  ) {}

  async run(input: {
    id: string;
    datePrevisionnelleDebut: Date | null;
    datePrevisionnelleFin: Date | null;
    auteurModificationId: string;
  }): Promise<Action> {
    return this.dependencies.actionRepository.modifierDatesPrevisionnelles(input);
  }
}
