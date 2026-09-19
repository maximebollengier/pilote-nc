import PvaRepository from "@/server/proposition-valeur-avancement/domain/ports/PvaRepository";
import PvaValeurTrimestrielle, {
  PvaEvenement,
} from "@/server/proposition-valeur-avancement/domain/PvaValeurTrimestrielle.interface";
import { NotFoundError } from "@/server/app/error-boundary/not-found-error";

export default class RecupererHistoriquePvaUseCase {
  constructor(
    private readonly dependencies: { pvaRepository: PvaRepository },
  ) {}

  async run(
    pvaId: string,
  ): Promise<{ pva: PvaValeurTrimestrielle; evenements: PvaEvenement[] }> {
    const pva = await this.dependencies.pvaRepository.récupérerParId(pvaId);
    if (!pva) throw new NotFoundError("Proposition introuvable");

    const evenements =
      await this.dependencies.pvaRepository.récupérerHistorique(pvaId);

    return { pva, evenements };
  }
}
