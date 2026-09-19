import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ActionDroit } from "@/server/droits/domain/ActionDroit";
import Droit from "@/server/droits/domain/Droit.interface";
import DroitRepository from "@/server/droits/domain/ports/DroitRepository";
import { ProfilEnum } from "@/server/app/enum/profil.enum";

export default class PrismaDroitRepository implements DroitRepository {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async listerSurcharges(): Promise<Droit[]> {
    const droits = await this.dependencies.prisma.getInstance().droit.findMany();
    return droits.map((droit) => ({
      action: droit.action,
      profil: droit.profil,
      autorise: droit.autorise,
    }));
  }

  async definir(donnees: {
    action: ActionDroit;
    profil: ProfilEnum;
    autorise: boolean;
  }): Promise<Droit> {
    const droit = await this.dependencies.prisma.getInstance().droit.upsert({
      where: { action_profil: { action: donnees.action, profil: donnees.profil } },
      create: donnees,
      update: { autorise: donnees.autorise },
    });
    return { action: droit.action, profil: droit.profil, autorise: droit.autorise };
  }
}
