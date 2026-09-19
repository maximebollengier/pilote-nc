import MesureRepository from "@/server/mesures/domain/ports/MesureRepository";
import Mesure from "@/server/mesures/domain/Mesure.interface";

export default class ListerMesuresUseCase {
  constructor(
    private readonly dependencies: { mesureRepository: MesureRepository },
  ) {}

  async run(): Promise<Mesure[]> {
    return this.dependencies.mesureRepository.lister();
  }
}
