import UtilisateurRepository from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";
import Utilisateur from "@/server/gestion-utilisateur/domain/Utilisateur.interface";

export default class ListerUtilisateursUseCase {
  constructor(
    private readonly dependencies: { utilisateurRepository: UtilisateurRepository },
  ) {}

  async run(): Promise<Utilisateur[]> {
    return this.dependencies.utilisateurRepository.lister();
  }
}
