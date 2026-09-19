import ActionRepository from "@/server/actions/domain/ports/ActionRepository";
import Action from "@/server/actions/domain/Action.interface";

export default class DefinirBlocageActionUseCase {
  constructor(
    private readonly dependencies: { actionRepository: ActionRepository },
  ) {}

  async run(input: {
    id: string;
    bloquee: boolean;
    raisonBlocage: string | null;
    precisionArbitrage: string | null;
    auteurModificationId: string;
  }): Promise<Action> {
    return this.dependencies.actionRepository.définirBlocage({
      ...input,
      // Le déblocage efface systématiquement la raison/précision, quoi que le
      // client ait pu envoyer — l'invariant "pas bloquée ⇒ pas de motif" est
      // garanti côté serveur, pas seulement par l'UI.
      raisonBlocage: input.bloquee ? input.raisonBlocage : null,
      precisionArbitrage: input.bloquee ? input.precisionArbitrage : null,
    });
  }
}
