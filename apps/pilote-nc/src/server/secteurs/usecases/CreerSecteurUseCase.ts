import SecteurRepository from "@/server/secteurs/domain/ports/SecteurRepository";
import Secteur from "@/server/secteurs/domain/Secteur.interface";

export default class CreerSecteurUseCase {
  constructor(
    private readonly dependencies: { secteurRepository: SecteurRepository },
  ) {}

  async run(input: {
    code: string;
    nom: string;
    accordGouvernance: boolean;
    membreGouvernementId: string | null;
    auteurCreationId: string;
  }): Promise<Secteur> {
    return this.dependencies.secteurRepository.créer(input);
  }
}
