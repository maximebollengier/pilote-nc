import ActionRepository from "@/server/actions/domain/ports/ActionRepository";
import { ActionAvecMesure } from "@/server/actions/domain/Action.interface";

export default class ListerToutesActionsUseCase {
  constructor(
    private readonly dependencies: { actionRepository: ActionRepository },
  ) {}

  async run(): Promise<ActionAvecMesure[]> {
    return this.dependencies.actionRepository.listerToutes();
  }
}
