import IndicateurImpactRepository from "@/server/indicateurs-impact/domain/ports/IndicateurImpactRepository";
import IndicateurImpact from "@/server/indicateurs-impact/domain/IndicateurImpact.interface";

export default class ListerIndicateursImpactUseCase {
  constructor(
    private readonly dependencies: {
      indicateurImpactRepository: IndicateurImpactRepository;
    },
  ) {}

  async run(mesureId: string): Promise<IndicateurImpact[]> {
    return this.dependencies.indicateurImpactRepository.listerParMesure(
      mesureId,
    );
  }
}
