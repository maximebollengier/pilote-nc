import DirectionRepository from "@/server/directions/domain/ports/DirectionRepository";
import Direction from "@/server/directions/domain/Direction.interface";

export default class ListerDirectionsUseCase {
  constructor(
    private readonly dependencies: {
      directionRepository: DirectionRepository;
    },
  ) {}

  async run(): Promise<Direction[]> {
    return this.dependencies.directionRepository.lister();
  }
}
