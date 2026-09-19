import { ProfilEnum } from "@/server/app/enum/profil.enum";

export default interface Utilisateur {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  profil: ProfilEnum;
  transparenceGlobale: boolean;
  directionId: string | null;
  // Secteurs auxquels l'utilisateur est habilité (DIRECTION_NC, ou
  // MEMBRE_GOUVERNEMENT sans transparenceGlobale).
  habilitationsSecteur: string[];
}
