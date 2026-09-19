import { ActionDroit } from "@/server/droits/domain/ActionDroit";
import Droit from "@/server/droits/domain/Droit.interface";
import { ProfilEnum } from "@/server/app/enum/profil.enum";

export default interface DroitRepository {
  // Uniquement les surcharges explicitement enregistrées (jamais la matrice
  // complète) — l'absence de ligne pour une combinaison (action, profil)
  // signifie "valeur par défaut", résolue par estAutorise().
  listerSurcharges(): Promise<Droit[]>;
  definir(donnees: {
    action: ActionDroit;
    profil: ProfilEnum;
    autorise: boolean;
  }): Promise<Droit>;
}
