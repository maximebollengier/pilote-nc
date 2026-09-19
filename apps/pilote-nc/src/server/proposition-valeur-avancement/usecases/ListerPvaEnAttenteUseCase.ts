import PvaRepository from "@/server/proposition-valeur-avancement/domain/ports/PvaRepository";
import { PvaEnAttente } from "@/server/proposition-valeur-avancement/domain/PvaValeurTrimestrielle.interface";

export default class ListerPvaEnAttenteUseCase {
  constructor(
    private readonly dependencies: { pvaRepository: PvaRepository },
  ) {}

  async run(): Promise<PvaEnAttente[]> {
    return this.dependencies.pvaRepository.listerEnAttente();
  }
}
