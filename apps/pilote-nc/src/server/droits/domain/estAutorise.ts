import { ActionDroit, DROITS_PAR_DEFAUT } from "@/server/droits/domain/ActionDroit";
import Droit from "@/server/droits/domain/Droit.interface";
import { ProfilEnum } from "@/server/app/enum/profil.enum";

export function estAutorise(
  surcharges: Droit[],
  action: ActionDroit,
  profil: ProfilEnum,
): boolean {
  const surcharge = surcharges.find(
    (droit) => droit.action === action && droit.profil === profil,
  );
  if (surcharge) return surcharge.autorise;
  return DROITS_PAR_DEFAUT[action].includes(profil);
}
