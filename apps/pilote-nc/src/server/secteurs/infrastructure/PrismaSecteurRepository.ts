import { PrismaPilote } from "@/server/db/PrismaPilote";
import Secteur from "@/server/secteurs/domain/Secteur.interface";
import SecteurRepository from "@/server/secteurs/domain/ports/SecteurRepository";

export default class PrismaSecteurRepository implements SecteurRepository {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async créer(donnees: {
    code: string;
    nom: string;
    accordGouvernance: boolean;
    membreGouvernementId: string | null;
    auteurCreationId: string;
  }): Promise<Secteur> {
    const secteur = await this.dependencies.prisma.getInstance().secteur.create({
      data: {
        code: donnees.code,
        nom: donnees.nom,
        accordGouvernance: donnees.accordGouvernance,
        membreGouvernementId: donnees.membreGouvernementId,
        auteurCreationId: donnees.auteurCreationId,
      },
    });
    return this.versSecteur(secteur);
  }

  async lister(): Promise<Secteur[]> {
    const secteurs = await this.dependencies.prisma
      .getInstance()
      .secteur.findMany({
        where: { deletedAt: null },
        orderBy: { nom: "asc" },
      });
    return secteurs.map((secteur) => this.versSecteur(secteur));
  }

  async récupérerParId(id: string): Promise<Secteur | null> {
    const secteur = await this.dependencies.prisma
      .getInstance()
      .secteur.findUnique({ where: { id, deletedAt: null } });
    return secteur ? this.versSecteur(secteur) : null;
  }

  async modifier(donnees: {
    id: string;
    code: string;
    nom: string;
    accordGouvernance: boolean;
    membreGouvernementId: string | null;
    auteurModificationId: string;
  }): Promise<Secteur> {
    const secteur = await this.dependencies.prisma.getInstance().secteur.update(
      {
        where: { id: donnees.id },
        data: {
          code: donnees.code,
          nom: donnees.nom,
          accordGouvernance: donnees.accordGouvernance,
          membreGouvernementId: donnees.membreGouvernementId,
          auteurModificationId: donnees.auteurModificationId,
        },
      },
    );
    return this.versSecteur(secteur);
  }

  async supprimer(donnees: {
    id: string;
    auteurModificationId: string;
  }): Promise<void> {
    await this.dependencies.prisma.getInstance().secteur.update({
      where: { id: donnees.id },
      data: {
        deletedAt: new Date(),
        auteurModificationId: donnees.auteurModificationId,
      },
    });
  }

  private versSecteur(secteur: {
    id: string;
    code: string;
    nom: string;
    accordGouvernance: boolean;
    membreGouvernementId: string | null;
  }): Secteur {
    return {
      id: secteur.id,
      code: secteur.code,
      nom: secteur.nom,
      accordGouvernance: secteur.accordGouvernance,
      membreGouvernementId: secteur.membreGouvernementId,
    };
  }
}
