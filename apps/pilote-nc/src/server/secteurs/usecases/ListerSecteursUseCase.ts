import SecteurRepository from "@/server/secteurs/domain/ports/SecteurRepository";
import Secteur from "@/server/secteurs/domain/Secteur.interface";

export default class ListerSecteursUseCase {
  constructor(
    private readonly dependencies: { secteurRepository: SecteurRepository },
  ) {}

  async run(): Promise<Secteur[]> {
    return this.dependencies.secteurRepository.lister();
  }
}
