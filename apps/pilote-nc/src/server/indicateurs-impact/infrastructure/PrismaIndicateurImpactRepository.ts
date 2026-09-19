import { PrismaPilote } from "@/server/db/PrismaPilote";
import IndicateurImpact from "@/server/indicateurs-impact/domain/IndicateurImpact.interface";
import IndicateurImpactRepository from "@/server/indicateurs-impact/domain/ports/IndicateurImpactRepository";
import { SensEvolution } from "@/server/indicateurs-impact/domain/SensEvolution";

export default class PrismaIndicateurImpactRepository
  implements IndicateurImpactRepository
{
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async créer(donnees: {
    mesureId: string;
    nom: string;
    unite: string | null;
    sensEvolution: SensEvolution;
    valeurInitiale: number;
    valeurCible: number;
    auteurCreationId: string;
  }): Promise<IndicateurImpact> {
    const indicateur = await this.dependencies.prisma
      .getInstance()
      .indicateurImpact.create({
        data: {
          mesureId: donnees.mesureId,
          nom: donnees.nom,
          unite: donnees.unite,
          sensEvolution: donnees.sensEvolution,
          valeurInitiale: donnees.valeurInitiale,
          valeurCible: donnees.valeurCible,
          auteurCreationId: donnees.auteurCreationId,
        },
      });
    return this.versIndicateur(indicateur);
  }

  async listerParMesure(mesureId: string): Promise<IndicateurImpact[]> {
    const indicateurs = await this.dependencies.prisma
      .getInstance()
      .indicateurImpact.findMany({
        where: { mesureId, deletedAt: null },
        orderBy: { nom: "asc" },
      });
    return indicateurs.map((indicateur) => this.versIndicateur(indicateur));
  }

  async récupérerParId(id: string): Promise<IndicateurImpact | null> {
    const indicateur = await this.dependencies.prisma
      .getInstance()
      .indicateurImpact.findUnique({ where: { id, deletedAt: null } });
    return indicateur ? this.versIndicateur(indicateur) : null;
  }

  async récupérerScopeParId(
    id: string,
  ): Promise<{ mesureId: string; secteurId: string } | null> {
    const indicateur = await this.dependencies.prisma
      .getInstance()
      .indicateurImpact.findUnique({
        where: { id, deletedAt: null },
        select: { mesureId: true, mesure: { select: { secteurId: true } } },
      });
    return indicateur
      ? { mesureId: indicateur.mesureId, secteurId: indicateur.mesure.secteurId }
      : null;
  }

  async mettreAJourValeurActuelle(donnees: {
    id: string;
    valeurActuelle: number;
    dateValeurActuelle: Date;
    tauxRealisation: number | null;
  }): Promise<void> {
    await this.dependencies.prisma.getInstance().indicateurImpact.update({
      where: { id: donnees.id },
      data: {
        valeurActuelle: donnees.valeurActuelle,
        dateValeurActuelle: donnees.dateValeurActuelle,
        tauxRealisation: donnees.tauxRealisation,
      },
    });
  }

  private versIndicateur(indicateur: {
    id: string;
    mesureId: string;
    nom: string;
    unite: string | null;
    sensEvolution: SensEvolution;
    valeurInitiale: number;
    valeurCible: number;
    valeurActuelle: number | null;
    dateValeurActuelle: Date | null;
    tauxRealisation: number | null;
  }): IndicateurImpact {
    return {
      id: indicateur.id,
      mesureId: indicateur.mesureId,
      nom: indicateur.nom,
      unite: indicateur.unite,
      sensEvolution: indicateur.sensEvolution,
      valeurInitiale: indicateur.valeurInitiale,
      valeurCible: indicateur.valeurCible,
      valeurActuelle: indicateur.valeurActuelle,
      dateValeurActuelle: indicateur.dateValeurActuelle,
      tauxRealisation: indicateur.tauxRealisation,
    };
  }
}
