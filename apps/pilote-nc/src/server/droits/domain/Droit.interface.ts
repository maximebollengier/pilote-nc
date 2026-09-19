import { ActionDroit } from "@/server/droits/domain/ActionDroit";
import { ProfilEnum } from "@/server/app/enum/profil.enum";

export default interface Droit {
  action: ActionDroit;
  profil: ProfilEnum;
  autorise: boolean;
}
