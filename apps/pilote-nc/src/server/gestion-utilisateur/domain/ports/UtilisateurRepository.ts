import { ProfilEnum } from "@/server/app/enum/profil.enum";
import Utilisateur from "@/server/gestion-utilisateur/domain/Utilisateur.interface";

export default interface UtilisateurRepository {
  récupérer(email: string): Promise<Utilisateur | null>;
  récupérerParId(id: string): Promise<Utilisateur | null>;
  lister(): Promise<Utilisateur[]>;
  compterParDirection(directionId: string): Promise<number>;
  créer(donnees: {
    email: string;
    nom: string;
    prenom: string;
    profil: ProfilEnum;
    transparenceGlobale: boolean;
  }): Promise<Utilisateur>;
  modifierHabilitationsSecteur(donnees: {
    utilisateurId: string;
    secteurIds: string[];
  }): Promise<Utilisateur>;
}
