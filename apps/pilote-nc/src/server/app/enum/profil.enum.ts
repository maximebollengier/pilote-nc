import { $Enums } from "@/database/generated/prisma-client";

export const ProfilEnum = $Enums.ProfilEnum;
export type ProfilEnum = $Enums.ProfilEnum;

export const LIBELLES_PROFIL: Record<ProfilEnum, string> = {
  PRESIDENT: "Président",
  MEMBRE_GOUVERNEMENT: "Membre du gouvernement",
  SECRETARIAT_GENERAL: "Secrétariat général",
  DIRECTION_NC: "Direction NC",
  ADMIN_OUTIL: "Admin outil",
};
