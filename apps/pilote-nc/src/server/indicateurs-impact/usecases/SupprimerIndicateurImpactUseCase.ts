import IndicateurImpactRepository from "@/server/indicateurs-impact/domain/ports/IndicateurImpactRepository";

export default class SupprimerIndicateurImpactUseCase {
  constructor(
    private readonly dependencies: {
      indicateurImpactRepository: IndicateurImpactRepository;
    },
  ) {}

  async run(input: { id: string; auteurModificationId: string }): Promise<void> {
    return this.dependencies.indicateurImpactRepository.supprimer(input);
  }
}
