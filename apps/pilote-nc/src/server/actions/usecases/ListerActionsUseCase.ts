import ActionRepository from "@/server/actions/domain/ports/ActionRepository";
import Action from "@/server/actions/domain/Action.interface";

export default class ListerActionsUseCase {
  constructor(
    private readonly dependencies: { actionRepository: ActionRepository },
  ) {}

  async run(mesureId: string): Promise<Action[]> {
    return this.dependencies.actionRepository.listerParMesure(mesureId);
  }
}
