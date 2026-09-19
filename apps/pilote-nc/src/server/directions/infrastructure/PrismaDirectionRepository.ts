import { PrismaPilote } from "@/server/db/PrismaPilote";
import Direction from "@/server/directions/domain/Direction.interface";
import DirectionRepository from "@/server/directions/domain/ports/DirectionRepository";

export default class PrismaDirectionRepository
  implements DirectionRepository
{
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async créer(donnees: {
    code: string;
    nom: string;
    secteurIds: string[];
    auteurCreationId: string;
  }): Promise<Direction> {
    const direction = await this.dependencies.prisma
      .getInstance()
      .direction.create({
        data: {
          code: donnees.code,
          nom: donnees.nom,
          auteurCreationId: donnees.auteurCreationId,
          secteurs: {
            create: donnees.secteurIds.map((secteurId) => ({ secteurId })),
          },
        },
        include: { secteurs: true },
      });
    return this.versDirection(direction);
  }

  async lister(): Promise<Direction[]> {
    const directions = await this.dependencies.prisma
      .getInstance()
      .direction.findMany({
        where: { deletedAt: null },
        include: { secteurs: true },
        orderBy: { nom: "asc" },
      });
    return directions.map((direction) => this.versDirection(direction));
  }

  async récupérerParId(id: string): Promise<Direction | null> {
    const direction = await this.dependencies.prisma
      .getInstance()
      .direction.findUnique({
        where: { id, deletedAt: null },
        include: { secteurs: true },
      });
    return direction ? this.versDirection(direction) : null;
  }

  // Appelée depuis `ModifierDirectionUseCase` à l'intérieur d'un
  // `transaction.run(...)` : les deux écritures ci-dessous partagent donc la
  // même transaction Prisma via l'AsyncLocalStorage de `getInstance()`, sans
  // que ce repository ait besoin d'ouvrir sa propre transaction imbriquée.
  async modifier(donnees: {
    id: string;
    code: string;
    nom: string;
    secteurIds: string[];
    auteurModificationId: string;
  }): Promise<Direction> {
    await this.dependencies.prisma.getInstance().directionSecteur.deleteMany({
      where: { directionId: donnees.id },
    });
    const direction = await this.dependencies.prisma
      .getInstance()
      .direction.update({
        where: { id: donnees.id },
        data: {
          code: donnees.code,
          nom: donnees.nom,
          auteurModificationId: donnees.auteurModificationId,
          secteurs: {
            create: donnees.secteurIds.map((secteurId) => ({ secteurId })),
          },
        },
        include: { secteurs: true },
      });
    return this.versDirection(direction);
  }

  async supprimer(donnees: {
    id: string;
    auteurModificationId: string;
  }): Promise<void> {
    await this.dependencies.prisma.getInstance().direction.update({
      where: { id: donnees.id },
      data: {
        deletedAt: new Date(),
        auteurModificationId: donnees.auteurModificationId,
      },
    });
  }

  private versDirection(direction: {
    id: string;
    code: string;
    nom: string;
    secteurs: { secteurId: string }[];
  }): Direction {
    return {
      id: direction.id,
      code: direction.code,
      nom: direction.nom,
      secteurIds: direction.secteurs.map((liaison) => liaison.secteurId),
    };
  }
}
