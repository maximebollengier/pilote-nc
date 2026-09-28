import DroitRepository from "@/server/droits/domain/ports/DroitRepository";
import Droit from "@/server/droits/domain/Droit.interface";
import { ORDRE_ACTION_DROIT } from "@/server/droits/domain/ActionDroit";
import { estAutorise } from "@/server/droits/domain/estAutorise";
import { PROFILS_ASSIGNABLES } from "@/server/app/enum/profil.enum";

export default class ListerDroitsUseCase {
  constructor(
    private readonly dependencies: { droitRepository: DroitRepository },
  ) {}

  // Renvoie la matrice complète (chaque action × chaque profil assignable),
  // valeurs par défaut comprises — c'est ce qu'affiche la page Admin > Droits.
  // NON_DEFINI en est exclu : sans accès par construction, il n'a pas sa
  // place dans une matrice de droits.
  async run(): Promise<Droit[]> {
    const surcharges = await this.dependencies.droitRepository.listerSurcharges();

    return ORDRE_ACTION_DROIT.flatMap((action) =>
      PROFILS_ASSIGNABLES.map((profil) => ({
        action,
        profil,
        autorise: estAutorise(surcharges, action, profil),
      })),
    );
  }
}
