import MesureRepository from "@/server/mesures/domain/ports/MesureRepository";
import Mesure from "@/server/mesures/domain/Mesure.interface";
import { MesurePrioritaire } from "@/server/mesures/domain/MesurePrioritaire";
import { PhaseMesure } from "@/server/mesures/domain/PhaseMesure";

export default class CreerMesureUseCase {
  constructor(
    private readonly dependencies: { mesureRepository: MesureRepository },
  ) {}

  async run(input: {
    code: string;
    titre: string;
    description: string | null;
    secteurId: string;
    coPorteurIds: string[];
    mesurePrioritaire: MesurePrioritaire;
    phase: PhaseMesure;
    auteurCreationId: string;
  }): Promise<Mesure> {
    return this.dependencies.mesureRepository.créer(input);
  }
}
