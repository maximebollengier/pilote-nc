import { PrismaPilote } from "@/server/db/PrismaPilote";
import EntreeJournal from "@/server/journal/domain/EntreeJournal.interface";
import JournalRepository from "@/server/journal/domain/ports/JournalRepository";
import { TypeEvenementPva } from "@/server/proposition-valeur-avancement/domain/StatutPva";

type Auteur = { nom: string; prenom: string } | null;

const LIBELLES_EVENEMENT_PVA: Record<TypeEvenementPva, string> = {
  SOUMISE: "Soumission d'un résultat trimestriel",
  MODIFIEE_PAR_SG: "Validation avec modification d'un résultat trimestriel",
  VALIDEE: "Validation d'un résultat trimestriel",
  REFUSEE: "Refus d'un résultat trimestriel",
};

export default class PrismaJournalRepository implements JournalRepository {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async lister(): Promise<EntreeJournal[]> {
    const prisma = this.dependencies.prisma.getInstance();

    const [mesures, actions, secteurs, directions, indicateurs, evenementsPva] =
      await Promise.all([
        prisma.mesure.findMany({
          include: {
            auteurCreation: { select: { nom: true, prenom: true } },
            auteurModification: { select: { nom: true, prenom: true } },
          },
        }),
        prisma.action.findMany({
          include: {
            mesure: { select: { titre: true } },
            auteurCreation: { select: { nom: true, prenom: true } },
            auteurModification: { select: { nom: true, prenom: true } },
          },
        }),
        prisma.secteur.findMany({
          include: {
            auteurCreation: { select: { nom: true, prenom: true } },
            auteurModification: { select: { nom: true, prenom: true } },
          },
        }),
        prisma.direction.findMany({
          include: {
            auteurCreation: { select: { nom: true, prenom: true } },
            auteurModification: { select: { nom: true, prenom: true } },
          },
        }),
        prisma.indicateurImpact.findMany({
          include: {
            mesure: { select: { titre: true } },
            auteurCreation: { select: { nom: true, prenom: true } },
          },
        }),
        prisma.pvaEvenement.findMany({
          include: {
            auteur: { select: { nom: true, prenom: true } },
            pva: {
              select: {
                annee: true,
                trimestre: true,
                indicateur: { select: { nom: true } },
              },
            },
          },
        }),
      ]);

    const entrees: EntreeJournal[] = [];

    for (const mesure of mesures) {
      const cible = `la mesure ${mesure.code} — ${mesure.titre}`;
      entrees.push(
        this.entréeCréation(mesure, mesure.auteurCreation, cible),
      );
      const entréeModif = this.entréeModificationOuSuppression(mesure, cible);
      if (entréeModif) entrees.push(entréeModif);
    }

    for (const action of actions) {
      const cible = `l'action ${action.titre} (${action.mesure.titre})`;
      entrees.push(
        this.entréeCréation(action, action.auteurCreation, cible),
      );
      const entréeModif = this.entréeModificationOuSuppression(action, cible);
      if (entréeModif) entrees.push(entréeModif);
    }

    for (const secteur of secteurs) {
      const cible = `le secteur ${secteur.code} — ${secteur.nom}`;
      entrees.push(
        this.entréeCréation(secteur, secteur.auteurCreation, cible),
      );
      const entréeModif = this.entréeModificationOuSuppression(secteur, cible);
      if (entréeModif) entrees.push(entréeModif);
    }

    for (const direction of directions) {
      const cible = `la direction ${direction.code} — ${direction.nom}`;
      entrees.push(
        this.entréeCréation(direction, direction.auteurCreation, cible),
      );
      const entréeModif = this.entréeModificationOuSuppression(
        direction,
        cible,
      );
      if (entréeModif) entrees.push(entréeModif);
    }

    // Pas d'entrée « modification » générique pour les indicateurs : leurs
    // seules mises à jour réelles (valeurActuelle/tauxRealisation) passent
    // par le workflow PVA, déjà tracé précisément ci-dessous — un doublon
    // horodaté à l'identique serait juste du bruit.
    for (const indicateur of indicateurs) {
      entrees.push(
        this.entréeCréation(
          indicateur,
          indicateur.auteurCreation,
          `l'indicateur d'impact ${indicateur.nom} (${indicateur.mesure.titre})`,
        ),
      );
    }

    for (const evenement of evenementsPva) {
      entrees.push({
        id: `pva-evenement-${evenement.id}`,
        action: `${LIBELLES_EVENEMENT_PVA[evenement.type]} — ${evenement.pva.indicateur.nom} T${evenement.pva.trimestre} ${evenement.pva.annee}`,
        auteurNom: this.nomAuteur(evenement.auteur),
        date: evenement.createdAt,
      });
    }

    return entrees.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  private nomAuteur(auteur: Auteur): string {
    return auteur ? `${auteur.prenom} ${auteur.nom}` : "—";
  }

  private entréeCréation(
    entite: { id: string; createdAt: Date },
    auteurCreation: Auteur,
    cible: string,
  ): EntreeJournal {
    return {
      id: `creation-${entite.id}`,
      action: `Création de ${cible}`,
      auteurNom: this.nomAuteur(auteurCreation),
      date: entite.createdAt,
    };
  }

  private entréeModificationOuSuppression(
    entite: {
      id: string;
      createdAt: Date;
      updatedAt: Date;
      deletedAt: Date | null;
      auteurCreation: Auteur;
      auteurModification: Auteur;
    },
    cible: string,
  ): EntreeJournal | null {
    if (entite.deletedAt) {
      return {
        id: `suppression-${entite.id}`,
        action: `Suppression de ${cible}`,
        auteurNom: this.nomAuteur(entite.auteurModification ?? entite.auteurCreation),
        date: entite.deletedAt,
      };
    }

    if (entite.updatedAt.getTime() !== entite.createdAt.getTime()) {
      return {
        id: `modification-${entite.id}`,
        action: `Modification de ${cible}`,
        auteurNom: this.nomAuteur(entite.auteurModification ?? entite.auteurCreation),
        date: entite.updatedAt,
      };
    }

    return null;
  }
}
