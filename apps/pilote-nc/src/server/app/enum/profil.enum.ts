import { $Enums } from "@/database/generated/prisma-client";

export const ProfilEnum = $Enums.ProfilEnum;
export type ProfilEnum = $Enums.ProfilEnum;

export const LIBELLES_PROFIL: Record<ProfilEnum, string> = {
  NON_DEFINI: "Non défini",
  PRESIDENT: "Président",
  MEMBRE_GOUVERNEMENT: "Membre du gouvernement",
  SECRETARIAT_GENERAL: "Secrétariat général",
  DIRECTION_NC: "Direction NC",
  ADMIN_OUTIL: "Admin outil",
};

// Profils qu'un ADMIN_OUTIL peut attribuer (création ou modification) et qui
// figurent dans la matrice de droits. Exclut NON_DEFINI : c'est un état
// transitoire posé automatiquement à la première connexion, jamais un choix.
export const PROFILS_ASSIGNABLES: ProfilEnum[] = [
  ProfilEnum.PRESIDENT,
  ProfilEnum.MEMBRE_GOUVERNEMENT,
  ProfilEnum.SECRETARIAT_GENERAL,
  ProfilEnum.DIRECTION_NC,
  ProfilEnum.ADMIN_OUTIL,
];
