import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import Utilisateur from "@/server/gestion-utilisateur/domain/Utilisateur.interface";
import UtilisateurRepository from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";

export default class PrismaUtilisateurRepository
  implements UtilisateurRepository
{
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async récupérer(email: string): Promise<Utilisateur | null> {
    const utilisateur = await this.dependencies.prisma
      .getInstance()
      .utilisateur.findUnique({
        where: { email, deletedAt: null },
        include: { habilitationsSecteur: true },
      });

    return utilisateur ? this.versUtilisateur(utilisateur) : null;
  }

  async récupérerParId(id: string): Promise<Utilisateur | null> {
    const utilisateur = await this.dependencies.prisma
      .getInstance()
      .utilisateur.findUnique({
        where: { id, deletedAt: null },
        include: { habilitationsSecteur: true },
      });

    return utilisateur ? this.versUtilisateur(utilisateur) : null;
  }

  async lister(): Promise<Utilisateur[]> {
    const utilisateurs = await this.dependencies.prisma
      .getInstance()
      .utilisateur.findMany({
        where: { deletedAt: null },
        include: { habilitationsSecteur: true },
        orderBy: [{ nom: "asc" }, { prenom: "asc" }],
      });
    return utilisateurs.map((utilisateur) => this.versUtilisateur(utilisateur));
  }

  async compterParDirection(directionId: string): Promise<number> {
    return this.dependencies.prisma.getInstance().utilisateur.count({
      where: { directionId, deletedAt: null },
    });
  }

  async créer(donnees: {
    email: string;
    nom: string;
    prenom: string;
    profil: ProfilEnum;
    transparenceGlobale: boolean;
  }): Promise<Utilisateur> {
    const utilisateur = await this.dependencies.prisma
      .getInstance()
      .utilisateur.create({
        data: {
          email: donnees.email,
          nom: donnees.nom,
          prenom: donnees.prenom,
          profil: donnees.profil,
          transparenceGlobale: donnees.transparenceGlobale,
        },
        include: { habilitationsSecteur: true },
      });
    return this.versUtilisateur(utilisateur);
  }

  // Appelée depuis `ModifierHabilitationsSecteurUseCase` à l'intérieur d'un
  // `transaction.run(...)` : les deux écritures ci-dessous partagent donc la
  // même transaction Prisma via l'AsyncLocalStorage de `getInstance()`, sans
  // que ce repository ait besoin d'ouvrir sa propre transaction imbriquée.
  async modifierHabilitationsSecteur(donnees: {
    utilisateurId: string;
    secteurIds: string[];
  }): Promise<Utilisateur> {
    await this.dependencies.prisma.getInstance().habilitationSecteur.deleteMany({
      where: { utilisateurId: donnees.utilisateurId },
    });
    const utilisateur = await this.dependencies.prisma
      .getInstance()
      .utilisateur.update({
        where: { id: donnees.utilisateurId },
        data: {
          habilitationsSecteur: {
            create: donnees.secteurIds.map((secteurId) => ({ secteurId })),
          },
        },
        include: { habilitationsSecteur: true },
      });
    return this.versUtilisateur(utilisateur);
  }

  private versUtilisateur(utilisateur: {
    id: string;
    email: string;
    nom: string;
    prenom: string;
    profil: Utilisateur["profil"];
    transparenceGlobale: boolean;
    directionId: string | null;
    habilitationsSecteur: { secteurId: string }[];
  }): Utilisateur {
    return {
      id: utilisateur.id,
      email: utilisateur.email,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      profil: utilisateur.profil,
      transparenceGlobale: utilisateur.transparenceGlobale,
      directionId: utilisateur.directionId,
      habilitationsSecteur: utilisateur.habilitationsSecteur.map(
        (habilitation) => habilitation.secteurId,
      ),
    };
  }
}
