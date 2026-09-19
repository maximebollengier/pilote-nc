import MesureRepository from "@/server/mesures/domain/ports/MesureRepository";
import Mesure from "@/server/mesures/domain/Mesure.interface";
import { PhaseMesure } from "@/server/mesures/domain/PhaseMesure";

export default class ModifierPhaseMesureUseCase {
  constructor(
    private readonly dependencies: { mesureRepository: MesureRepository },
  ) {}

  async run(input: {
    id: string;
    phase: PhaseMesure;
    auteurModificationId: string;
  }): Promise<Mesure> {
    return this.dependencies.mesureRepository.modifierPhase(input);
  }
}
