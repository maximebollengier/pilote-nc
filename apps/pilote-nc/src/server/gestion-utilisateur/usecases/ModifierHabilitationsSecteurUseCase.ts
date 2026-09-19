import UtilisateurRepository from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";
import Utilisateur from "@/server/gestion-utilisateur/domain/Utilisateur.interface";
import { Transaction } from "@/server/db/Transaction";

export default class ModifierHabilitationsSecteurUseCase {
  constructor(
    private readonly dependencies: {
      utilisateurRepository: UtilisateurRepository;
      transaction: Transaction;
    },
  ) {}

  async run(input: {
    utilisateurId: string;
    secteurIds: string[];
  }): Promise<Utilisateur> {
    return this.dependencies.transaction.run(() =>
      this.dependencies.utilisateurRepository.modifierHabilitationsSecteur(input),
    );
  }
}
