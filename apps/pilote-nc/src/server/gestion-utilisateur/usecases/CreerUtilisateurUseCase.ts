import { ProfilEnum } from "@/server/app/enum/profil.enum";
import UtilisateurRepository from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";
import Utilisateur from "@/server/gestion-utilisateur/domain/Utilisateur.interface";

export default class CreerUtilisateurUseCase {
  constructor(
    private readonly dependencies: { utilisateurRepository: UtilisateurRepository },
  ) {}

  async run(input: {
    email: string;
    nom: string;
    prenom: string;
    profil: ProfilEnum;
    transparenceGlobale: boolean;
  }): Promise<Utilisateur> {
    return this.dependencies.utilisateurRepository.créer(input);
  }
}
