import DirectionRepository from "@/server/directions/domain/ports/DirectionRepository";
import Direction from "@/server/directions/domain/Direction.interface";

export default class CreerDirectionUseCase {
  constructor(
    private readonly dependencies: {
      directionRepository: DirectionRepository;
    },
  ) {}

  async run(input: {
    code: string;
    nom: string;
    secteurIds: string[];
    auteurCreationId: string;
  }): Promise<Direction> {
    return this.dependencies.directionRepository.créer(input);
  }
}
