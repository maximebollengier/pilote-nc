import MesureRepository from "@/server/mesures/domain/ports/MesureRepository";

export default class RecalculerMeteoMesureUseCase {
  constructor(
    private readonly dependencies: { mesureRepository: MesureRepository },
  ) {}

  async run(mesureId: string): Promise<void> {
    return this.dependencies.mesureRepository.recalculerMeteo(mesureId);
  }
}
