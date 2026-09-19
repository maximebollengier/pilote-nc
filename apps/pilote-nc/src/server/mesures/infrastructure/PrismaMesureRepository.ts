import { PrismaPilote } from "@/server/db/PrismaPilote";
import Mesure from "@/server/mesures/domain/Mesure.interface";
import MesureRepository from "@/server/mesures/domain/ports/MesureRepository";
import { StatutMesure } from "@/server/mesures/domain/StatutMesure";
import { MesurePrioritaire } from "@/server/mesures/domain/MesurePrioritaire";
import { PhaseMesure } from "@/server/mesures/domain/PhaseMesure";
import { calculerMeteoAvancement } from "@/server/mesures/domain/calculerMeteoAvancement";
import { calculerTauxAvancementIndicateurs } from "@/server/indicateurs-impact/domain/calculerTauxAvancementIndicateurs";

export default class PrismaMesureRepository implements MesureRepository {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async créer(donnees: {
    code: string;
    titre: string;
    description: string | null;
    secteurId: string;
    coPorteurIds: string[];
    mesurePrioritaire: MesurePrioritaire;
    phase: PhaseMesure;
    auteurCreationId: string;
  }): Promise<Mesure> {
    const mesure = await this.dependencies.prisma.getInstance().mesure.create({
      data: {
        code: donnees.code,
        titre: donnees.titre,
        description: donnees.description,
        secteurId: donnees.secteurId,
        coPorteurs: {
          create: donnees.coPorteurIds.map((secteurId) => ({ secteurId })),
        },
        mesurePrioritaire: donnees.mesurePrioritaire,
        phase: donnees.phase,
        auteurCreationId: donnees.auteurCreationId,
      },
      include: this.inclusionCoPorteurs,
    });
    return this.versMesure(mesure, null, 0);
  }

  async lister(): Promise<Mesure[]> {
    const mesures = await this.dependencies.prisma
      .getInstance()
      .mesure.findMany({
        where: { deletedAt: null },
        orderBy: { titre: "asc" },
        include: { ...this.inclusionIndicateurs, ...this.inclusionCoPorteurs },
      });
    return mesures.map((mesure) =>
      this.versMesure(
        mesure,
        this.extraireTauxAvancementIndicateurs(mesure),
        mesure.indicateurs.length,
      ),
    );
  }

  async récupérerParId(id: string): Promise<Mesure | null> {
    const mesure = await this.dependencies.prisma.getInstance().mesure.findUnique({
      where: { id, deletedAt: null },
      include: { ...this.inclusionIndicateurs, ...this.inclusionCoPorteurs },
    });
    return mesure
      ? this.versMesure(
          mesure,
          this.extraireTauxAvancementIndicateurs(mesure),
          mesure.indicateurs.length,
        )
      : null;
  }

  async modifier(donnees: {
    id: string;
    code: string;
    titre: string;
    secteurId: string;
    coPorteurIds: string[];
    mesurePrioritaire: MesurePrioritaire;
    auteurModificationId: string;
  }): Promise<Mesure> {
    const mesure = await this.dependencies.prisma.getInstance().mesure.update({
      where: { id: donnees.id },
      data: {
        code: donnees.code,
        titre: donnees.titre,
        secteurId: donnees.secteurId,
        coPorteurs: {
          deleteMany: {},
          create: donnees.coPorteurIds.map((secteurId) => ({ secteurId })),
        },
        mesurePrioritaire: donnees.mesurePrioritaire,
        auteurModificationId: donnees.auteurModificationId,
      },
      include: { ...this.inclusionIndicateurs, ...this.inclusionCoPorteurs },
    });
    return this.versMesure(
      mesure,
      this.extraireTauxAvancementIndicateurs(mesure),
      mesure.indicateurs.length,
    );
  }

  async modifierStatut(donnees: {
    id: string;
    statut: StatutMesure;
    auteurModificationId: string;
  }): Promise<Mesure> {
    const mesure = await this.dependencies.prisma.getInstance().mesure.update({
      where: { id: donnees.id },
      data: {
        statut: donnees.statut,
        auteurModificationId: donnees.auteurModificationId,
      },
      include: { ...this.inclusionIndicateurs, ...this.inclusionCoPorteurs },
    });
    return this.versMesure(
      mesure,
      this.extraireTauxAvancementIndicateurs(mesure),
      mesure.indicateurs.length,
    );
  }

  async modifierPhase(donnees: {
    id: string;
    phase: PhaseMesure;
    auteurModificationId: string;
  }): Promise<Mesure> {
    const mesure = await this.dependencies.prisma.getInstance().mesure.update({
      where: { id: donnees.id },
      data: {
        phase: donnees.phase,
        auteurModificationId: donnees.auteurModificationId,
      },
      include: { ...this.inclusionIndicateurs, ...this.inclusionCoPorteurs },
    });
    return this.versMesure(
      mesure,
      this.extraireTauxAvancementIndicateurs(mesure),
      mesure.indicateurs.length,
    );
  }

  async recalculerMeteo(mesureId: string): Promise<void> {
    const actions = await this.dependencies.prisma
      .getInstance()
      .action.findMany({
        where: { mesureId, deletedAt: null },
        select: { tauxAvancement: true },
      });

    const meteoAvancement = calculerMeteoAvancement(
      actions.map((action) => action.tauxAvancement),
    );

    await this.dependencies.prisma.getInstance().mesure.update({
      where: { id: mesureId },
      data: { meteoAvancement, dateCalculMeteo: new Date() },
    });
  }

  async compterParSecteur(secteurId: string): Promise<number> {
    return this.dependencies.prisma.getInstance().mesure.count({
      where: { secteurId, deletedAt: null },
    });
  }

  private readonly inclusionIndicateurs = {
    indicateurs: {
      where: { deletedAt: null },
      select: { tauxRealisation: true },
    },
  };

  private readonly inclusionCoPorteurs = {
    coPorteurs: {
      select: { secteurId: true },
    },
  };

  private extraireTauxAvancementIndicateurs(mesure: {
    indicateurs: { tauxRealisation: number | null }[];
  }): number | null {
    return calculerTauxAvancementIndicateurs(
      mesure.indicateurs.map((indicateur) => indicateur.tauxRealisation),
    );
  }

  private versMesure(
    mesure: {
      id: string;
      code: string;
      titre: string;
      description: string | null;
      secteurId: string;
      coPorteurs: { secteurId: string }[];
      mesurePrioritaire: MesurePrioritaire;
      statut: StatutMesure;
      phase: PhaseMesure;
      datePrevisionnelleDebut: Date | null;
      datePrevisionnelleFin: Date | null;
      dateActee: Date | null;
      dateAchevement: Date | null;
      meteoAvancement: number | null;
      dateCalculMeteo: Date | null;
    },
    tauxAvancementIndicateurs: number | null,
    nombreIndicateurs: number,
  ): Mesure {
    return {
      id: mesure.id,
      code: mesure.code,
      titre: mesure.titre,
      description: mesure.description,
      secteurId: mesure.secteurId,
      coPorteurIds: mesure.coPorteurs.map((coPorteur) => coPorteur.secteurId),
      mesurePrioritaire: mesure.mesurePrioritaire,
      statut: mesure.statut,
      phase: mesure.phase,
      datePrevisionnelleDebut: mesure.datePrevisionnelleDebut,
      datePrevisionnelleFin: mesure.datePrevisionnelleFin,
      dateActee: mesure.dateActee,
      dateAchevement: mesure.dateAchevement,
      meteoAvancement: mesure.meteoAvancement,
      dateCalculMeteo: mesure.dateCalculMeteo,
      tauxAvancementIndicateurs,
      nombreIndicateurs,
    };
  }
}
