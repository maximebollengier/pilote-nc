import SecteurRepository from "@/server/secteurs/domain/ports/SecteurRepository";
import Secteur from "@/server/secteurs/domain/Secteur.interface";

export default class ModifierSecteurUseCase {
  constructor(
    private readonly dependencies: { secteurRepository: SecteurRepository },
  ) {}

  async run(input: {
    id: string;
    code: string;
    nom: string;
    accordGouvernance: boolean;
    membreGouvernementId: string | null;
    auteurModificationId: string;
  }): Promise<Secteur> {
    return this.dependencies.secteurRepository.modifier(input);
  }
}
