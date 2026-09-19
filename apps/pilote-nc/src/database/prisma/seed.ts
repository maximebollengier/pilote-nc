import {
  PrismaClient,
  ProfilEnum,
  SensEvolution,
  TypeAction,
  MesurePrioritaire,
  Secteur,
} from "@/database/generated/prisma-client";
import { calculerMeteoAvancement } from "@/server/mesures/domain/calculerMeteoAvancement";
import { calculerTauxRealisation } from "@/server/indicateurs-impact/domain/calculerTauxRealisation";

const prisma = new PrismaClient();

const SECTEURS_PAR_DEFAUT: { code: string; nom: string }[] = [
  { code: "SECT-TRANSPORT", nom: "Transport" },
  { code: "SECT-SANTE", nom: "Santé et protection sociale" },
  { code: "SECT-ECO-ATTRACT", nom: "Economie et attractivité" },
  { code: "SECT-FISCALITE", nom: "Fiscalité" },
  { code: "SECT-DOUANES", nom: "Questions douanières" },
  { code: "SECT-SOUV-ALIM", nom: "Souveraineté alimentaire" },
  { code: "SECT-ENSEIGNEMENT", nom: "Enseignement" },
  { code: "SECT-JEUNESSE-SPORT", nom: "Jeunesse et sports" },
  { code: "SECT-ENFANCE", nom: "Protection de l'enfance" },
  { code: "SECT-URBANISME", nom: "Urbanisme et aménagement du territoire" },
  { code: "SECT-NUMERIQUE", nom: "Transformation numérique" },
  { code: "SECT-COMMANDE-PUB", nom: "Commande publique et patrimoine" },
  { code: "SECT-BUDGET", nom: "Budget et finances" },
  { code: "SECT-FONCTION-PUB", nom: "Fonction publique" },
  { code: "SECT-MINES-ENERGIE", nom: "Mines et énergies" },
  {
    code: "SECT-TRAVAIL-EMPLOI",
    nom: "Travail, emploi et formation professionnelle",
  },
  { code: "SECT-PECHE-OCEAN", nom: "Pêche, océan, recherche et climat" },
  { code: "SECT-CULTURE", nom: "Culture, égalité et citoyenneté" },
  { code: "SECT-ESS", nom: "Economie sociale et solidaire" },
  { code: "SECT-EAU", nom: "Eau" },
  { code: "SECT-COUTUMIER", nom: "Affaires coutumières" },
];

const STATUTS_DE_DEMONSTRATION = ["A_L_ETUDE", "ACTEE", "ABANDONNEE"] as const;

// Avancement par défaut cohérent avec le statut de la mesure, pour que les
// jauges du tableau de bord affichent une donnée de démonstration réaliste.
const PROGRESSION_PAR_DEFAUT: Record<
  (typeof STATUTS_DE_DEMONSTRATION)[number],
  number
> = {
  A_L_ETUDE: 10,
  ACTEE: 60,
  ABANDONNEE: 25,
};

// 3 actions dont la moyenne vaut exactement `progression`, avec un peu de
// variation autour de cette valeur pour rester réaliste.
function actionsPourMesure(progression: number) {
  const ecart = Math.min(10, progression, 100 - progression);
  return [
    {
      titre: "Cadrage et diagnostic initial",
      type: TypeAction.ORGANISATIONNEL_RH,
      tauxAvancement: progression - ecart,
    },
    {
      titre: "Mise en œuvre opérationnelle",
      type: TypeAction.TECHNIQUE_SI,
      tauxAvancement: progression,
    },
    {
      titre: "Déploiement et généralisation",
      type: TypeAction.COMMUNICATION,
      tauxAvancement: progression + ecart,
    },
  ];
}

type SpecMesure = {
  code: string;
  titre: string;
  mesurePrioritaire: MesurePrioritaire;
  secteurCode: string;
};

const MESURES_PAR_DEFAUT: SpecMesure[] = [
  // Maîtrise des dépenses publiques et exemplarité
  {
    code: "MES-101",
    titre: "Rationalisation du parc automobile administratif",
    mesurePrioritaire: MesurePrioritaire.MAITRISE_DEPENSES_PUBLIQUES_ET_EXEMPLARITE,
    secteurCode: "SECT-BUDGET",
  },
  {
    code: "MES-102",
    titre: "Plan d'économies sur les dépenses de fonctionnement",
    mesurePrioritaire: MesurePrioritaire.MAITRISE_DEPENSES_PUBLIQUES_ET_EXEMPLARITE,
    secteurCode: "SECT-BUDGET",
  },
  {
    code: "MES-103",
    titre: "Réduction du train de vie des institutions",
    mesurePrioritaire: MesurePrioritaire.MAITRISE_DEPENSES_PUBLIQUES_ET_EXEMPLARITE,
    secteurCode: "SECT-FONCTION-PUB",
  },
  {
    code: "MES-104",
    titre: "Optimisation des achats publics groupés",
    mesurePrioritaire: MesurePrioritaire.MAITRISE_DEPENSES_PUBLIQUES_ET_EXEMPLARITE,
    secteurCode: "SECT-COMMANDE-PUB",
  },
  {
    code: "MES-105",
    titre: "Audit des opérateurs publics et satellites",
    mesurePrioritaire: MesurePrioritaire.MAITRISE_DEPENSES_PUBLIQUES_ET_EXEMPLARITE,
    secteurCode: "SECT-BUDGET",
  },
  // Sauvegarde des régimes sociaux
  {
    code: "MES-106",
    titre: "Réforme du régime unifié d'assurance maladie",
    mesurePrioritaire: MesurePrioritaire.SAUVEGARDE_REGIMES_SOCIAUX,
    secteurCode: "SECT-SANTE",
  },
  {
    code: "MES-107",
    titre: "Plan de résorption de la dette sociale",
    mesurePrioritaire: MesurePrioritaire.SAUVEGARDE_REGIMES_SOCIAUX,
    secteurCode: "SECT-BUDGET",
  },
  {
    code: "MES-108",
    titre: "Modernisation du recouvrement des cotisations sociales",
    mesurePrioritaire: MesurePrioritaire.SAUVEGARDE_REGIMES_SOCIAUX,
    secteurCode: "SECT-SANTE",
  },
  {
    code: "MES-109",
    titre: "Lutte contre la fraude aux prestations sociales",
    mesurePrioritaire: MesurePrioritaire.SAUVEGARDE_REGIMES_SOCIAUX,
    secteurCode: "SECT-SANTE",
  },
  {
    code: "MES-110",
    titre: "Refonte de la gouvernance des caisses sociales",
    mesurePrioritaire: MesurePrioritaire.SAUVEGARDE_REGIMES_SOCIAUX,
    secteurCode: "SECT-SANTE",
  },
  // Réforme des retraites du secteur privé
  {
    code: "MES-111",
    titre: "Harmonisation des régimes de retraite complémentaire",
    mesurePrioritaire: MesurePrioritaire.REFORME_RETRAITES_SECTEUR_PRIVE,
    secteurCode: "SECT-TRAVAIL-EMPLOI",
  },
  {
    code: "MES-112",
    titre: "Revalorisation des petites pensions",
    mesurePrioritaire: MesurePrioritaire.REFORME_RETRAITES_SECTEUR_PRIVE,
    secteurCode: "SECT-TRAVAIL-EMPLOI",
  },
  {
    code: "MES-113",
    titre: "Création d'un dispositif de retraite par capitalisation",
    mesurePrioritaire: MesurePrioritaire.REFORME_RETRAITES_SECTEUR_PRIVE,
    secteurCode: "SECT-TRAVAIL-EMPLOI",
  },
  {
    code: "MES-114",
    titre: "Allongement progressif de la durée de cotisation",
    mesurePrioritaire: MesurePrioritaire.REFORME_RETRAITES_SECTEUR_PRIVE,
    secteurCode: "SECT-TRAVAIL-EMPLOI",
  },
  {
    code: "MES-115",
    titre: "Accompagnement des transitions emploi-retraite",
    mesurePrioritaire: MesurePrioritaire.REFORME_RETRAITES_SECTEUR_PRIVE,
    secteurCode: "SECT-TRAVAIL-EMPLOI",
  },
  // Fiscalité et relance économique
  {
    code: "MES-116",
    titre: "Réforme de la fiscalité des entreprises",
    mesurePrioritaire: MesurePrioritaire.FISCALITE_ET_RELANCE_ECONOMIQUE,
    secteurCode: "SECT-FISCALITE",
  },
  {
    code: "MES-117",
    titre: "Plan de relance de l'investissement productif",
    mesurePrioritaire: MesurePrioritaire.FISCALITE_ET_RELANCE_ECONOMIQUE,
    secteurCode: "SECT-ECO-ATTRACT",
  },
  {
    code: "MES-118",
    titre: "Simplification des démarches fiscales",
    mesurePrioritaire: MesurePrioritaire.FISCALITE_ET_RELANCE_ECONOMIQUE,
    secteurCode: "SECT-FISCALITE",
  },
  {
    code: "MES-119",
    titre: "Soutien fiscal aux filières d'exportation",
    mesurePrioritaire: MesurePrioritaire.FISCALITE_ET_RELANCE_ECONOMIQUE,
    secteurCode: "SECT-DOUANES",
  },
  {
    code: "MES-120",
    titre: "Création de zones franches d'activité économique",
    mesurePrioritaire: MesurePrioritaire.FISCALITE_ET_RELANCE_ECONOMIQUE,
    secteurCode: "SECT-ECO-ATTRACT",
  },
  // Pouvoir d'achat et urgence sociale
  {
    code: "MES-121",
    titre: "Bouclier tarifaire sur les produits de première nécessité",
    mesurePrioritaire: MesurePrioritaire.POUVOIR_ACHAT_ET_URGENCE_SOCIALE,
    secteurCode: "SECT-ECO-ATTRACT",
  },
  {
    code: "MES-122",
    titre: "Aide exceptionnelle au logement",
    mesurePrioritaire: MesurePrioritaire.POUVOIR_ACHAT_ET_URGENCE_SOCIALE,
    secteurCode: "SECT-URBANISME",
  },
  {
    code: "MES-123",
    titre: "Revalorisation du salaire minimum",
    mesurePrioritaire: MesurePrioritaire.POUVOIR_ACHAT_ET_URGENCE_SOCIALE,
    secteurCode: "SECT-TRAVAIL-EMPLOI",
  },
  {
    code: "MES-124",
    titre: "Chèque énergie pour les foyers modestes",
    mesurePrioritaire: MesurePrioritaire.POUVOIR_ACHAT_ET_URGENCE_SOCIALE,
    secteurCode: "SECT-MINES-ENERGIE",
  },
  {
    code: "MES-125",
    titre: "Gratuité partielle des transports du quotidien",
    mesurePrioritaire: MesurePrioritaire.POUVOIR_ACHAT_ET_URGENCE_SOCIALE,
    secteurCode: "SECT-TRANSPORT",
  },
];

// 3 indicateurs génériques mais structurellement variés par mesure : un taux
// d'avancement, un volume de bénéficiaires (qui croît avec l'index pour
// varier les cibles), un délai à faire baisser. `valeurActuelle` est calée
// sur `progression` (même position relative entre valeurInitiale et
// valeurCible, quel que soit le sens d'évolution) pour que le taux de
// réalisation de démonstration corresponde à l'avancement de la mesure.
function indicateursPourMesure(index: number, progression: number) {
  const avecValeurActuelle = (specification: {
    nom: string;
    unite: string | null;
    sensEvolution: SensEvolution;
    valeurInitiale: number;
    valeurCible: number;
  }) => {
    const fraction = progression / 100;
    const valeurActuelle =
      specification.sensEvolution === SensEvolution.A_LA_HAUSSE
        ? specification.valeurInitiale +
          (specification.valeurCible - specification.valeurInitiale) *
            fraction
        : specification.valeurInitiale -
          (specification.valeurInitiale - specification.valeurCible) *
            fraction;

    return {
      ...specification,
      valeurActuelle,
      dateValeurActuelle: new Date(),
      tauxRealisation: calculerTauxRealisation({ ...specification, valeurActuelle }),
    };
  };

  return [
    avecValeurActuelle({
      nom: "Taux d'avancement des jalons prévus",
      unite: "%",
      sensEvolution: SensEvolution.A_LA_HAUSSE,
      valeurInitiale: 0,
      valeurCible: 100,
    }),
    avecValeurActuelle({
      nom: "Nombre de bénéficiaires ou structures concernés",
      unite: null,
      sensEvolution: SensEvolution.A_LA_HAUSSE,
      valeurInitiale: 0,
      valeurCible: 500 + index * 50,
    }),
    avecValeurActuelle({
      nom: "Délai moyen de mise en œuvre",
      unite: "jours",
      sensEvolution: SensEvolution.A_LA_BAISSE,
      valeurInitiale: 90,
      valeurCible: 30,
    }),
  ];
}

// Recalcule et persiste la météo d'une mesure à partir de ses actions
// actuelles en base (idempotent, sans dépendre de ce que le seed vient
// lui-même de créer).
async function recalculerMeteo(mesureId: string) {
  const actions = await prisma.action.findMany({
    where: { mesureId, deletedAt: null },
    select: { tauxAvancement: true },
  });
  await prisma.mesure.update({
    where: { id: mesureId },
    data: {
      meteoAvancement: calculerMeteoAvancement(
        actions.map((action) => action.tauxAvancement),
      ),
      dateCalculMeteo: new Date(),
    },
  });
}

async function main() {
  const admin = await prisma.utilisateur.upsert({
    where: { email: "admin.outil@example.com" },
    create: {
      email: "admin.outil@example.com",
      nom: "Outil",
      prenom: "Admin",
      profil: ProfilEnum.ADMIN_OUTIL,
    },
    update: {},
  });

  const secteur = await prisma.secteur.upsert({
    where: { code: "SECT-EDU" },
    create: {
      code: "SECT-EDU",
      nom: "Éducation",
      auteurCreationId: admin.id,
    },
    update: {},
  });

  const direction = await prisma.direction.upsert({
    where: { code: "DIR-ENS" },
    create: {
      code: "DIR-ENS",
      nom: "Direction de l'enseignement",
      auteurCreationId: admin.id,
      secteurs: {
        create: { secteurId: secteur.id },
      },
    },
    update: {},
  });

  const president = await prisma.utilisateur.upsert({
    where: { email: "president@example.com" },
    create: {
      email: "president@example.com",
      nom: "Président",
      prenom: "Gouvernement",
      profil: ProfilEnum.PRESIDENT,
    },
    update: {},
  });

  const membreGouvernement = await prisma.utilisateur.upsert({
    where: { email: "membre.gouvernement.education@example.com" },
    create: {
      email: "membre.gouvernement.education@example.com",
      nom: "Membre",
      prenom: "Éducation",
      profil: ProfilEnum.MEMBRE_GOUVERNEMENT,
      habilitationsSecteur: { create: { secteurId: secteur.id } },
    },
    update: {},
  });

  const secretaireGeneral = await prisma.utilisateur.upsert({
    where: { email: "secretariat.general@example.com" },
    create: {
      email: "secretariat.general@example.com",
      nom: "Secrétariat",
      prenom: "Général",
      profil: ProfilEnum.SECRETARIAT_GENERAL,
    },
    update: {},
  });

  const directionNc = await prisma.utilisateur.upsert({
    where: { email: "direction.enseignement@example.com" },
    create: {
      email: "direction.enseignement@example.com",
      nom: "Direction",
      prenom: "Enseignement",
      profil: ProfilEnum.DIRECTION_NC,
      directionId: direction.id,
      habilitationsSecteur: { create: { secteurId: secteur.id } },
    },
    update: {},
  });

  const mesure = await prisma.mesure.upsert({
    where: { code: "MES-001" },
    create: {
      code: "MES-001",
      titre: "Rénover les établissements scolaires du premier degré",
      description:
        "Programme de rénovation énergétique et de mise aux normes des écoles primaires.",
      secteurId: secteur.id,
      mesurePrioritaire: MesurePrioritaire.FISCALITE_ET_RELANCE_ECONOMIQUE,
      statut: "ACTEE",
      auteurCreationId: admin.id,
    },
    update: {},
  });

  const actionsExistantesMesure001 = await prisma.action.count({
    where: { mesureId: mesure.id, deletedAt: null },
  });
  if (actionsExistantesMesure001 === 0) {
    await prisma.action.createMany({
      data: [
        {
          mesureId: mesure.id,
          titre: "Diagnostic technique des bâtiments",
          type: TypeAction.TECHNIQUE_SI,
          tauxAvancement: 100,
          auteurCreationId: admin.id,
        },
        {
          mesureId: mesure.id,
          titre: "Appel d'offres travaux",
          type: TypeAction.TRAVAUX_AMENAGEMENT,
          tauxAvancement: 40,
          auteurCreationId: admin.id,
        },
        {
          mesureId: mesure.id,
          titre: "Cadrage budgétaire",
          type: TypeAction.BUDGETAIRE,
          tauxAvancement: 60,
          auteurCreationId: admin.id,
        },
      ],
    });
  }

  await recalculerMeteo(mesure.id);

  await prisma.indicateurImpact.upsert({
    where: { id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" },
    create: {
      id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      mesureId: mesure.id,
      nom: "Nombre d'écoles rénovées",
      unite: "écoles",
      sensEvolution: SensEvolution.A_LA_HAUSSE,
      valeurInitiale: 0,
      valeurCible: 20,
      auteurCreationId: admin.id,
    },
    update: {},
  });

  // ---- Secteurs par défaut ----
  const secteursParCode = new Map<string, Secteur>();
  for (const specSecteur of SECTEURS_PAR_DEFAUT) {
    const secteurCree = await prisma.secteur.upsert({
      where: { code: specSecteur.code },
      create: {
        code: specSecteur.code,
        nom: specSecteur.nom,
        auteurCreationId: admin.id,
      },
      update: {},
    });
    secteursParCode.set(specSecteur.code, secteurCree);
  }

  // ---- 5 mesures par mesure prioritaire, 3 indicateurs par mesure ----
  for (const [index, specMesure] of MESURES_PAR_DEFAUT.entries()) {
    const secteurDeLaMesure = secteursParCode.get(specMesure.secteurCode);
    if (!secteurDeLaMesure) {
      throw new Error(`Secteur inconnu pour la mesure ${specMesure.code}`);
    }

    const statut = STATUTS_DE_DEMONSTRATION[index % 3];
    const progression = PROGRESSION_PAR_DEFAUT[statut];

    const mesureCreee = await prisma.mesure.upsert({
      where: { code: specMesure.code },
      create: {
        code: specMesure.code,
        titre: specMesure.titre,
        secteurId: secteurDeLaMesure.id,
        mesurePrioritaire: specMesure.mesurePrioritaire,
        statut,
        auteurCreationId: admin.id,
      },
      update: {},
    });

    const actionsExistantes = await prisma.action.count({
      where: { mesureId: mesureCreee.id, deletedAt: null },
    });
    if (actionsExistantes === 0) {
      await prisma.action.createMany({
        data: actionsPourMesure(progression).map((specAction) => ({
          ...specAction,
          mesureId: mesureCreee.id,
          auteurCreationId: admin.id,
        })),
      });
    }
    await recalculerMeteo(mesureCreee.id);

    // Un indicateur peut déjà exister sans valeur par défaut (créé par une
    // exécution précédente du seed, avant l'ajout de `valeurActuelle`) : on
    // le complète alors, sans jamais écraser une valeur réelle déjà validée
    // via le workflow PVA.
    for (const specIndicateur of indicateursPourMesure(index, progression)) {
      const indicateurExistant = await prisma.indicateurImpact.findFirst({
        where: {
          mesureId: mesureCreee.id,
          nom: specIndicateur.nom,
          deletedAt: null,
        },
      });

      if (!indicateurExistant) {
        await prisma.indicateurImpact.create({
          data: {
            ...specIndicateur,
            mesureId: mesureCreee.id,
            auteurCreationId: admin.id,
          },
        });
      } else if (indicateurExistant.valeurActuelle === null) {
        await prisma.indicateurImpact.update({
          where: { id: indicateurExistant.id },
          data: {
            valeurActuelle: specIndicateur.valeurActuelle,
            dateValeurActuelle: specIndicateur.dateValeurActuelle,
            tauxRealisation: specIndicateur.tauxRealisation,
          },
        });
      }
    }
  }

  // ---- Mesure catch-all pour les actions sans priorité gouvernementale ----
  const secteurBudget = secteursParCode.get("SECT-BUDGET");
  if (!secteurBudget) {
    throw new Error("Secteur SECT-BUDGET introuvable pour la mesure MES-000");
  }
  await prisma.mesure.upsert({
    where: { code: "MES-000" },
    create: {
      code: "MES-000",
      titre: "Mesure non prioritaire",
      secteurId: secteurBudget.id,
      mesurePrioritaire: MesurePrioritaire.NON_PRIORITAIRE,
      statut: "ACTEE",
      auteurCreationId: admin.id,
    },
    update: {},
  });

  // eslint-disable-next-line no-console
  console.log("Utilisateurs de test :", {
    admin: admin.email,
    president: president.email,
    membreGouvernement: membreGouvernement.email,
    secretaireGeneral: secretaireGeneral.email,
    directionNc: directionNc.email,
  });
  // eslint-disable-next-line no-console
  console.log(
    `Secteurs par défaut : ${SECTEURS_PAR_DEFAUT.length}, mesures par défaut : ${MESURES_PAR_DEFAUT.length}, indicateurs par défaut : ${MESURES_PAR_DEFAUT.length * 3}`,
  );
}

main()
  .catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
