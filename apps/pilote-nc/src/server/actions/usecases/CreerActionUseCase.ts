import ActionRepository from "@/server/actions/domain/ports/ActionRepository";
import Action from "@/server/actions/domain/Action.interface";
import { TypeAction } from "@/server/actions/domain/TypeAction";

export default class CreerActionUseCase {
  constructor(
    private readonly dependencies: { actionRepository: ActionRepository },
  ) {}

  async run(input: {
    mesureId: string;
    titre: string;
    type: TypeAction;
    dateEcheance: Date | null;
    datePrevisionnelleDebut: Date | null;
    datePrevisionnelleFin: Date | null;
    auteurCreationId: string;
  }): Promise<Action> {
    return this.dependencies.actionRepository.créer(input);
  }
}
