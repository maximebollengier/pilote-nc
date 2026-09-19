import { ProfilEnum } from "@/server/app/enum/profil.enum";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
    };
    profil: ProfilEnum;
    transparenceGlobale: boolean;
    habilitationsSecteur: string[];
  }
}
