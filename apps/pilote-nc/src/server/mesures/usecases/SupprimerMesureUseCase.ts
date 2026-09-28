import MesureRepository from "@/server/mesures/domain/ports/MesureRepository";
import { Transaction } from "@/server/db/Transaction";

export default class SupprimerMesureUseCase {
  constructor(
    private readonly dependencies: {
      mesureRepository: MesureRepository;
      transaction: Transaction;
    },
  ) {}

  async run(input: { id: string; auteurModificationId: string }): Promise<void> {
    // Une seule transaction pour la mesure et ses actions/indicateurs : soit
    // les trois sont supprimés, soit aucun (cf. PrismaMesureRepository.supprimer).
    return this.dependencies.transaction.run(() =>
      this.dependencies.mesureRepository.supprimer(input),
    );
  }
}
