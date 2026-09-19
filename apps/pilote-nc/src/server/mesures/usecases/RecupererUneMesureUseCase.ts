import MesureRepository from "@/server/mesures/domain/ports/MesureRepository";
import Mesure from "@/server/mesures/domain/Mesure.interface";

export default class RecupererUneMesureUseCase {
  constructor(
    private readonly dependencies: { mesureRepository: MesureRepository },
  ) {}

  async run(id: string): Promise<Mesure | null> {
    return this.dependencies.mesureRepository.récupérerParId(id);
  }
}
