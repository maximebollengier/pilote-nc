import DroitRepository from "@/server/droits/domain/ports/DroitRepository";
import Droit from "@/server/droits/domain/Droit.interface";
import { ActionDroit } from "@/server/droits/domain/ActionDroit";
import { ProfilEnum } from "@/server/app/enum/profil.enum";

export default class DefinirDroitUseCase {
  constructor(
    private readonly dependencies: { droitRepository: DroitRepository },
  ) {}

  async run(input: {
    action: ActionDroit;
    profil: ProfilEnum;
    autorise: boolean;
  }): Promise<Droit> {
    return this.dependencies.droitRepository.definir(input);
  }
}
