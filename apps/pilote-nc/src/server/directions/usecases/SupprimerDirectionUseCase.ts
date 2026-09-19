import DirectionRepository from "@/server/directions/domain/ports/DirectionRepository";
import UtilisateurRepository from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";
import { ConflictError } from "@/server/app/error-boundary/conflict-error";
import { NotFoundError } from "@/server/app/error-boundary/not-found-error";

export default class SupprimerDirectionUseCase {
  constructor(
    private readonly dependencies: {
      directionRepository: DirectionRepository;
      utilisateurRepository: UtilisateurRepository;
    },
  ) {}

  async run(input: { id: string; auteurModificationId: string }): Promise<void> {
    const direction = await this.dependencies.directionRepository.récupérerParId(
      input.id,
    );
    if (!direction) throw new NotFoundError("Direction introuvable");

    const nombreUtilisateurs =
      await this.dependencies.utilisateurRepository.compterParDirection(
        input.id,
      );
    if (nombreUtilisateurs > 0) {
      throw new ConflictError(
        `Impossible de supprimer cette direction : ${nombreUtilisateurs} utilisateur(s) y sont encore rattaché(s)`,
      );
    }

    await this.dependencies.directionRepository.supprimer(input);
  }
}
