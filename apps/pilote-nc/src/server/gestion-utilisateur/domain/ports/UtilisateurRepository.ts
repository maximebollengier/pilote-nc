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
  /**
   * Crée un compte minimal (sans nom, profil `NON_DEFINI`, aucun secteur)
   * s'il n'en existe pas déjà un pour cet email, pour la première connexion
   * d'un utilisateur reconnu par le fournisseur d'identité mais absent de
   * cette table. Ne réactive jamais un compte supprimé (`deletedAt` non
   * nul) : dans ce cas, comme si l'email n'existait pas, renvoie `null`.
   */
  provisionnerCompteMinimal(email: string): Promise<Utilisateur | null>;
  modifierHabilitationsSecteur(donnees: {
    utilisateurId: string;
    secteurIds: string[];
  }): Promise<Utilisateur>;
  modifier(donnees: {
    id: string;
    nom: string;
    prenom: string;
    profil: ProfilEnum;
    transparenceGlobale: boolean;
  }): Promise<Utilisateur>;
}
