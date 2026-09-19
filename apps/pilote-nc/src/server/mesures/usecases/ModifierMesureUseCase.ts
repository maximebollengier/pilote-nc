import MesureRepository from "@/server/mesures/domain/ports/MesureRepository";
import Mesure from "@/server/mesures/domain/Mesure.interface";
import { MesurePrioritaire } from "@/server/mesures/domain/MesurePrioritaire";

export default class ModifierMesureUseCase {
  constructor(
    private readonly dependencies: { mesureRepository: MesureRepository },
  ) {}

  async run(input: {
    id: string;
    code: string;
    titre: string;
    secteurId: string;
    coPorteurIds: string[];
    mesurePrioritaire: MesurePrioritaire;
    auteurModificationId: string;
  }): Promise<Mesure> {
    return this.dependencies.mesureRepository.modifier(input);
  }
}
