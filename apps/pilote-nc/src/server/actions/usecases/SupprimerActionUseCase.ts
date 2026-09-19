import ActionRepository from "@/server/actions/domain/ports/ActionRepository";

export default class SupprimerActionUseCase {
  constructor(
    private readonly dependencies: { actionRepository: ActionRepository },
  ) {}

  async run(input: { id: string; auteurModificationId: string }): Promise<void> {
    return this.dependencies.actionRepository.supprimer(input);
  }
}
