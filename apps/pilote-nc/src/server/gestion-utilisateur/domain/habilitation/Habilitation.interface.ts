import { ProfilEnum } from "@/server/app/enum/profil.enum";

export interface Habilitations {
  profil: ProfilEnum;
  habilitationsSecteur: string[];
  transparenceGlobale: boolean;
}

export interface EntiteScopeeParSecteur {
  secteurId: string;
}
