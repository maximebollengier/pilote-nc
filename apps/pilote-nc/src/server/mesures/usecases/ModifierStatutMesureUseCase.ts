import MesureRepository from "@/server/mesures/domain/ports/MesureRepository";
import Mesure from "@/server/mesures/domain/Mesure.interface";
import { StatutMesure } from "@/server/mesures/domain/StatutMesure";

export default class ModifierStatutMesureUseCase {
  constructor(
    private readonly dependencies: { mesureRepository: MesureRepository },
  ) {}

  async run(input: {
    id: string;
    statut: StatutMesure;
    auteurModificationId: string;
  }): Promise<Mesure> {
    return this.dependencies.mesureRepository.modifierStatut(input);
  }
}
