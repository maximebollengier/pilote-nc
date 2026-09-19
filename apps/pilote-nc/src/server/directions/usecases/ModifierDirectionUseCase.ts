import DirectionRepository from "@/server/directions/domain/ports/DirectionRepository";
import Direction from "@/server/directions/domain/Direction.interface";
import { Transaction } from "@/server/db/Transaction";

export default class ModifierDirectionUseCase {
  constructor(
    private readonly dependencies: {
      directionRepository: DirectionRepository;
      transaction: Transaction;
    },
  ) {}

  async run(input: {
    id: string;
    code: string;
    nom: string;
    secteurIds: string[];
    auteurModificationId: string;
  }): Promise<Direction> {
    return this.dependencies.transaction.run(() =>
      this.dependencies.directionRepository.modifier(input),
    );
  }
}
