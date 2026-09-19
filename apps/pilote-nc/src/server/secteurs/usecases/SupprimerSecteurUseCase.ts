import SecteurRepository from "@/server/secteurs/domain/ports/SecteurRepository";
import { ConflictError } from "@/server/app/error-boundary/conflict-error";
import { NotFoundError } from "@/server/app/error-boundary/not-found-error";
import MesureRepository from "@/server/mesures/domain/ports/MesureRepository";

export default class SupprimerSecteurUseCase {
  constructor(
    private readonly dependencies: {
      secteurRepository: SecteurRepository;
      mesureRepository: MesureRepository;
    },
  ) {}

  async run(input: { id: string; auteurModificationId: string }): Promise<void> {
    const secteur = await this.dependencies.secteurRepository.récupérerParId(
      input.id,
    );
    if (!secteur) throw new NotFoundError("Secteur introuvable");

    const nombreMesures = await this.dependencies.mesureRepository.compterParSecteur(
      input.id,
    );
    if (nombreMesures > 0) {
      throw new ConflictError(
        `Impossible de supprimer ce secteur : ${nombreMesures} mesure(s) y sont encore rattachée(s)`,
      );
    }

    await this.dependencies.secteurRepository.supprimer(input);
  }
}
