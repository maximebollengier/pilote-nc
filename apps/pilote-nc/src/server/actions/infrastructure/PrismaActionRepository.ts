import { PrismaPilote } from "@/server/db/PrismaPilote";
import Action, { ActionAvecMesure } from "@/server/actions/domain/Action.interface";
import ActionRepository from "@/server/actions/domain/ports/ActionRepository";
import { TypeAction } from "@/server/actions/domain/TypeAction";

export default class PrismaActionRepository implements ActionRepository {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async créer(donnees: {
    mesureId: string;
    titre: string;
    type: TypeAction;
    dateEcheance: Date | null;
    datePrevisionnelleDebut: Date | null;
    datePrevisionnelleFin: Date | null;
    auteurCreationId: string;
  }): Promise<Action> {
    const action = await this.dependencies.prisma.getInstance().action.create(
      {
        data: {
          mesureId: donnees.mesureId,
          titre: donnees.titre,
          type: donnees.type,
          dateEcheance: donnees.dateEcheance,
          datePrevisionnelleDebut: donnees.datePrevisionnelleDebut,
          datePrevisionnelleFin: donnees.datePrevisionnelleFin,
          auteurCreationId: donnees.auteurCreationId,
        },
      },
    );
    return this.versAction(action);
  }

  async listerParMesure(mesureId: string): Promise<Action[]> {
    const actions = await this.dependencies.prisma
      .getInstance()
      .action.findMany({
        where: { mesureId, deletedAt: null },
        orderBy: { titre: "asc" },
      });
    return actions.map((action) => this.versAction(action));
  }

  async listerToutes(): Promise<ActionAvecMesure[]> {
    const actions = await this.dependencies.prisma
      .getInstance()
      .action.findMany({
        where: { deletedAt: null },
        include: {
          mesure: { select: { titre: true, secteurId: true, mesurePrioritaire: true } },
        },
        orderBy: { titre: "asc" },
      });
    return actions.map((action) => ({
      ...this.versAction(action),
      mesureTitre: action.mesure.titre,
      secteurId: action.mesure.secteurId,
      mesurePrioritaire: action.mesure.mesurePrioritaire,
    }));
  }

  async récupérerParId(id: string): Promise<Action | null> {
    const action = await this.dependencies.prisma
      .getInstance()
      .action.findUnique({ where: { id, deletedAt: null } });
    return action ? this.versAction(action) : null;
  }

  async récupérerScopeParId(
    id: string,
  ): Promise<{ mesureId: string; secteurId: string } | null> {
    const action = await this.dependencies.prisma
      .getInstance()
      .action.findUnique({
        where: { id, deletedAt: null },
        select: { mesureId: true, mesure: { select: { secteurId: true } } },
      });
    return action
      ? { mesureId: action.mesureId, secteurId: action.mesure.secteurId }
      : null;
  }

  async saisirAvancement(donnees: {
    id: string;
    tauxAvancement: number;
    auteurModificationId: string;
  }): Promise<Action> {
    const action = await this.dependencies.prisma.getInstance().action.update(
      {
        where: { id: donnees.id },
        data: {
          tauxAvancement: donnees.tauxAvancement,
          dateMajTauxAvancement: new Date(),
          auteurModificationId: donnees.auteurModificationId,
        },
      },
    );
    return this.versAction(action);
  }

  async modifierDatesPrevisionnelles(donnees: {
    id: string;
    datePrevisionnelleDebut: Date | null;
    datePrevisionnelleFin: Date | null;
    auteurModificationId: string;
  }): Promise<Action> {
    const action = await this.dependencies.prisma.getInstance().action.update(
      {
        where: { id: donnees.id },
        data: {
          datePrevisionnelleDebut: donnees.datePrevisionnelleDebut,
          datePrevisionnelleFin: donnees.datePrevisionnelleFin,
          auteurModificationId: donnees.auteurModificationId,
        },
      },
    );
    return this.versAction(action);
  }

  async définirBlocage(donnees: {
    id: string;
    bloquee: boolean;
    raisonBlocage: string | null;
    precisionArbitrage: string | null;
    auteurModificationId: string;
  }): Promise<Action> {
    const action = await this.dependencies.prisma.getInstance().action.update(
      {
        where: { id: donnees.id },
        data: {
          bloquee: donnees.bloquee,
          raisonBlocage: donnees.raisonBlocage,
          precisionArbitrage: donnees.precisionArbitrage,
          auteurModificationId: donnees.auteurModificationId,
        },
      },
    );
    return this.versAction(action);
  }

  async supprimer(donnees: {
    id: string;
    auteurModificationId: string;
  }): Promise<void> {
    await this.dependencies.prisma.getInstance().action.update({
      where: { id: donnees.id },
      data: {
        deletedAt: new Date(),
        auteurModificationId: donnees.auteurModificationId,
      },
    });
  }

  private versAction(action: {
    id: string;
    mesureId: string;
    titre: string;
    type: TypeAction;
    tauxAvancement: number;
    dateMajTauxAvancement: Date | null;
    dateEcheance: Date | null;
    datePrevisionnelleDebut: Date | null;
    datePrevisionnelleFin: Date | null;
    bloquee: boolean;
    raisonBlocage: string | null;
    precisionArbitrage: string | null;
  }): Action {
    return {
      id: action.id,
      mesureId: action.mesureId,
      titre: action.titre,
      type: action.type,
      tauxAvancement: action.tauxAvancement,
      dateMajTauxAvancement: action.dateMajTauxAvancement,
      dateEcheance: action.dateEcheance,
      datePrevisionnelleDebut: action.datePrevisionnelleDebut,
      datePrevisionnelleFin: action.datePrevisionnelleFin,
      bloquee: action.bloquee,
      raisonBlocage: action.raisonBlocage,
      precisionArbitrage: action.precisionArbitrage,
    };
  }
}
