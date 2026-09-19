import { PrismaPilote } from "@/server/db/PrismaPilote";
import PvaValeurTrimestrielle, {
  PvaEnAttente,
  PvaEvenement,
} from "@/server/proposition-valeur-avancement/domain/PvaValeurTrimestrielle.interface";
import PvaRepository from "@/server/proposition-valeur-avancement/domain/ports/PvaRepository";
import { StatutPva } from "@/server/proposition-valeur-avancement/domain/StatutPva";

export default class PrismaPvaRepository implements PvaRepository {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async récupérerParCle(donnees: {
    indicateurId: string;
    annee: number;
    trimestre: number;
  }): Promise<PvaValeurTrimestrielle | null> {
    const pva = await this.dependencies.prisma
      .getInstance()
      .pvaValeurTrimestrielle.findUnique({
        where: {
          indicateurId_annee_trimestre: {
            indicateurId: donnees.indicateurId,
            annee: donnees.annee,
            trimestre: donnees.trimestre,
          },
        },
      });
    return pva ? this.versPva(pva) : null;
  }

  async récupérerParId(id: string): Promise<PvaValeurTrimestrielle | null> {
    const pva = await this.dependencies.prisma
      .getInstance()
      .pvaValeurTrimestrielle.findUnique({ where: { id } });
    return pva ? this.versPva(pva) : null;
  }

  async créer(donnees: {
    indicateurId: string;
    annee: number;
    trimestre: number;
    valeurProposee: number;
    soumisParId: string;
  }): Promise<PvaValeurTrimestrielle> {
    const pva = await this.dependencies.prisma
      .getInstance()
      .pvaValeurTrimestrielle.create({
        data: {
          indicateurId: donnees.indicateurId,
          annee: donnees.annee,
          trimestre: donnees.trimestre,
          valeurProposee: donnees.valeurProposee,
          soumisParId: donnees.soumisParId,
        },
      });
    return this.versPva(pva);
  }

  async réinitialiserPourResoumission(donnees: {
    id: string;
    valeurProposee: number;
    soumisParId: string;
  }): Promise<PvaValeurTrimestrielle> {
    const pva = await this.dependencies.prisma
      .getInstance()
      .pvaValeurTrimestrielle.update({
        where: { id: donnees.id },
        data: {
          valeurProposee: donnees.valeurProposee,
          soumisParId: donnees.soumisParId,
          dateSoumission: new Date(),
          statut: StatutPva.EN_ATTENTE_VALIDATION_SG,
          valeurValidee: null,
          motifRefus: null,
          commentaireSg: null,
          traiteParId: null,
          dateTraitement: null,
        },
      });
    return this.versPva(pva);
  }

  async listerEnAttente(): Promise<PvaEnAttente[]> {
    const pvas = await this.dependencies.prisma
      .getInstance()
      .pvaValeurTrimestrielle.findMany({
        where: { statut: StatutPva.EN_ATTENTE_VALIDATION_SG },
        include: {
          indicateur: {
            select: {
              nom: true,
              mesureId: true,
              mesure: { select: { titre: true, secteurId: true } },
            },
          },
        },
        orderBy: { dateSoumission: "asc" },
      });

    return pvas.map((pva) => ({
      ...this.versPva(pva),
      indicateurNom: pva.indicateur.nom,
      mesureId: pva.indicateur.mesureId,
      mesureTitre: pva.indicateur.mesure.titre,
      secteurId: pva.indicateur.mesure.secteurId,
    }));
  }

  async listerParIndicateur(
    indicateurId: string,
  ): Promise<PvaValeurTrimestrielle[]> {
    const pvas = await this.dependencies.prisma
      .getInstance()
      .pvaValeurTrimestrielle.findMany({
        where: { indicateurId },
        orderBy: [{ annee: "asc" }, { trimestre: "asc" }],
      });
    return pvas.map((pva) => this.versPva(pva));
  }

  async décider(donnees: {
    id: string;
    statut: StatutPva;
    valeurValidee: number | null;
    motifRefus: string | null;
    commentaireSg: string | null;
    traiteParId: string;
  }): Promise<PvaValeurTrimestrielle> {
    const pva = await this.dependencies.prisma
      .getInstance()
      .pvaValeurTrimestrielle.update({
        where: { id: donnees.id },
        data: {
          statut: donnees.statut,
          valeurValidee: donnees.valeurValidee,
          motifRefus: donnees.motifRefus,
          commentaireSg: donnees.commentaireSg,
          traiteParId: donnees.traiteParId,
          dateTraitement: new Date(),
        },
      });
    return this.versPva(pva);
  }

  async modifierValeurValidee(donnees: {
    id: string;
    valeurValidee: number;
    commentaireSg: string | null;
    traiteParId: string;
  }): Promise<PvaValeurTrimestrielle> {
    const pva = await this.dependencies.prisma
      .getInstance()
      .pvaValeurTrimestrielle.update({
        where: { id: donnees.id },
        data: {
          valeurValidee: donnees.valeurValidee,
          commentaireSg: donnees.commentaireSg,
          traiteParId: donnees.traiteParId,
          dateTraitement: new Date(),
        },
      });
    return this.versPva(pva);
  }

  async ajouterEvenement(donnees: {
    pvaId: string;
    type: "SOUMISE" | "MODIFIEE_PAR_SG" | "VALIDEE" | "REFUSEE";
    valeur: number | null;
    commentaire: string | null;
    auteurId: string;
  }): Promise<void> {
    await this.dependencies.prisma.getInstance().pvaEvenement.create({
      data: {
        pvaId: donnees.pvaId,
        type: donnees.type,
        valeur: donnees.valeur,
        commentaire: donnees.commentaire,
        auteurId: donnees.auteurId,
      },
    });
  }

  async récupérerHistorique(id: string): Promise<PvaEvenement[]> {
    const evenements = await this.dependencies.prisma
      .getInstance()
      .pvaEvenement.findMany({
        where: { pvaId: id },
        orderBy: { createdAt: "asc" },
      });
    return evenements.map((evenement) => ({
      id: evenement.id,
      type: evenement.type,
      valeur: evenement.valeur,
      commentaire: evenement.commentaire,
      auteurId: evenement.auteurId,
      createdAt: evenement.createdAt,
    }));
  }

  private versPva(pva: {
    id: string;
    indicateurId: string;
    annee: number;
    trimestre: number;
    valeurProposee: number;
    valeurValidee: number | null;
    statut: StatutPva;
    motifRefus: string | null;
    commentaireSg: string | null;
    soumisParId: string;
    dateSoumission: Date;
    traiteParId: string | null;
    dateTraitement: Date | null;
  }): PvaValeurTrimestrielle {
    return {
      id: pva.id,
      indicateurId: pva.indicateurId,
      annee: pva.annee,
      trimestre: pva.trimestre,
      valeurProposee: pva.valeurProposee,
      valeurValidee: pva.valeurValidee,
      statut: pva.statut,
      motifRefus: pva.motifRefus,
      commentaireSg: pva.commentaireSg,
      soumisParId: pva.soumisParId,
      dateSoumission: pva.dateSoumission,
      traiteParId: pva.traiteParId,
      dateTraitement: pva.dateTraitement,
    };
  }
}
