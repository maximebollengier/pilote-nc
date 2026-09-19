-- CreateEnum
CREATE TYPE "ProfilEnum" AS ENUM ('PRESIDENT', 'MEMBRE_GOUVERNEMENT', 'SECRETARIAT_GENERAL', 'DIRECTION_NC', 'ADMIN_OUTIL');

-- CreateEnum
CREATE TYPE "StatutMesure" AS ENUM ('A_L_ETUDE', 'ARBITRAGE_EN_COURS', 'ACTEE', 'PROGRAMMEE', 'EN_COURS', 'EN_ALERTE', 'ACHEVEE', 'ABANDONNEE');

-- CreateEnum
CREATE TYPE "TypeAction" AS ENUM ('JURIDIQUE', 'COMMUNICATION', 'BUDGETAIRE', 'ORGANISATIONNEL_RH', 'TECHNIQUE_SI', 'TRAVAUX_AMENAGEMENT');

-- CreateEnum
CREATE TYPE "SensEvolution" AS ENUM ('A_LA_HAUSSE', 'A_LA_BAISSE');

-- CreateEnum
CREATE TYPE "StatutPva" AS ENUM ('EN_ATTENTE_VALIDATION_SG', 'VALIDEE', 'VALIDEE_AVEC_MODIFICATION', 'REFUSEE');

-- CreateEnum
CREATE TYPE "TypeEvenementPva" AS ENUM ('SOUMISE', 'MODIFIEE_PAR_SG', 'VALIDEE', 'REFUSEE');

-- CreateTable
CREATE TABLE "secteur" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "membre_gouvernement_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "auteur_creation_id" UUID NOT NULL,
    "auteur_modification_id" UUID,

    CONSTRAINT "secteur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "direction" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "auteur_creation_id" UUID NOT NULL,
    "auteur_modification_id" UUID,

    CONSTRAINT "direction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "direction_secteur" (
    "direction_id" UUID NOT NULL,
    "secteur_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "direction_secteur_pkey" PRIMARY KEY ("direction_id","secteur_id")
);

-- CreateTable
CREATE TABLE "mesure" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "secteur_id" UUID NOT NULL,
    "statut" "StatutMesure" NOT NULL DEFAULT 'A_L_ETUDE',
    "date_previsionnelle_debut" DATE,
    "date_previsionnelle_fin" DATE,
    "date_actee" DATE,
    "date_achevement" DATE,
    "meteo_avancement" DOUBLE PRECISION,
    "date_calcul_meteo" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "auteur_creation_id" UUID NOT NULL,
    "auteur_modification_id" UUID,

    CONSTRAINT "mesure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "mesure_id" UUID NOT NULL,
    "titre" TEXT NOT NULL,
    "type" "TypeAction" NOT NULL,
    "taux_avancement" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "date_maj_taux_avancement" TIMESTAMP(3),
    "date_echeance" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "auteur_creation_id" UUID NOT NULL,
    "auteur_modification_id" UUID,

    CONSTRAINT "action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indicateur_impact" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "mesure_id" UUID NOT NULL,
    "nom" TEXT NOT NULL,
    "unite" TEXT,
    "sens_evolution" "SensEvolution" NOT NULL,
    "valeur_initiale" DOUBLE PRECISION NOT NULL,
    "valeur_cible" DOUBLE PRECISION NOT NULL,
    "valeur_actuelle" DOUBLE PRECISION,
    "date_valeur_actuelle" DATE,
    "taux_realisation" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "auteur_creation_id" UUID NOT NULL,
    "auteur_modification_id" UUID,

    CONSTRAINT "indicateur_impact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pva_valeur_trimestrielle" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "indicateur_id" UUID NOT NULL,
    "annee" INTEGER NOT NULL,
    "trimestre" INTEGER NOT NULL,
    "valeur_proposee" DOUBLE PRECISION NOT NULL,
    "valeur_validee" DOUBLE PRECISION,
    "statut" "StatutPva" NOT NULL DEFAULT 'EN_ATTENTE_VALIDATION_SG',
    "motif_refus" TEXT,
    "commentaire_sg" TEXT,
    "soumis_par_id" UUID NOT NULL,
    "date_soumission" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "traite_par_id" UUID,
    "date_traitement" TIMESTAMP(3),

    CONSTRAINT "pva_valeur_trimestrielle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pva_evenement" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pva_id" UUID NOT NULL,
    "type" "TypeEvenementPva" NOT NULL,
    "valeur" DOUBLE PRECISION,
    "commentaire" TEXT,
    "auteur_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pva_evenement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utilisateur" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "profil" "ProfilEnum" NOT NULL,
    "transparence_globale" BOOLEAN NOT NULL DEFAULT false,
    "direction_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "date_derniere_connexion" TIMESTAMP(3),

    CONSTRAINT "utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habilitation_secteur" (
    "utilisateur_id" UUID NOT NULL,
    "secteur_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "habilitation_secteur_pkey" PRIMARY KEY ("utilisateur_id","secteur_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "secteur_code_key" ON "secteur"("code");

-- CreateIndex
CREATE UNIQUE INDEX "direction_code_key" ON "direction"("code");

-- CreateIndex
CREATE UNIQUE INDEX "mesure_code_key" ON "mesure"("code");

-- CreateIndex
CREATE INDEX "mesure_secteur_id_idx" ON "mesure"("secteur_id");

-- CreateIndex
CREATE INDEX "mesure_statut_idx" ON "mesure"("statut");

-- CreateIndex
CREATE INDEX "action_mesure_id_idx" ON "action"("mesure_id");

-- CreateIndex
CREATE INDEX "indicateur_impact_mesure_id_idx" ON "indicateur_impact"("mesure_id");

-- CreateIndex
CREATE INDEX "pva_valeur_trimestrielle_statut_idx" ON "pva_valeur_trimestrielle"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "pva_valeur_trimestrielle_indicateur_id_annee_trimestre_key" ON "pva_valeur_trimestrielle"("indicateur_id", "annee", "trimestre");

-- CreateIndex
CREATE INDEX "pva_evenement_pva_id_idx" ON "pva_evenement"("pva_id");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateur_email_key" ON "utilisateur"("email");

-- AddForeignKey
ALTER TABLE "secteur" ADD CONSTRAINT "secteur_membre_gouvernement_id_fkey" FOREIGN KEY ("membre_gouvernement_id") REFERENCES "utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secteur" ADD CONSTRAINT "secteur_auteur_creation_id_fkey" FOREIGN KEY ("auteur_creation_id") REFERENCES "utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secteur" ADD CONSTRAINT "secteur_auteur_modification_id_fkey" FOREIGN KEY ("auteur_modification_id") REFERENCES "utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direction" ADD CONSTRAINT "direction_auteur_creation_id_fkey" FOREIGN KEY ("auteur_creation_id") REFERENCES "utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direction" ADD CONSTRAINT "direction_auteur_modification_id_fkey" FOREIGN KEY ("auteur_modification_id") REFERENCES "utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direction_secteur" ADD CONSTRAINT "direction_secteur_direction_id_fkey" FOREIGN KEY ("direction_id") REFERENCES "direction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direction_secteur" ADD CONSTRAINT "direction_secteur_secteur_id_fkey" FOREIGN KEY ("secteur_id") REFERENCES "secteur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesure" ADD CONSTRAINT "mesure_secteur_id_fkey" FOREIGN KEY ("secteur_id") REFERENCES "secteur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesure" ADD CONSTRAINT "mesure_auteur_creation_id_fkey" FOREIGN KEY ("auteur_creation_id") REFERENCES "utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesure" ADD CONSTRAINT "mesure_auteur_modification_id_fkey" FOREIGN KEY ("auteur_modification_id") REFERENCES "utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action" ADD CONSTRAINT "action_mesure_id_fkey" FOREIGN KEY ("mesure_id") REFERENCES "mesure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action" ADD CONSTRAINT "action_auteur_creation_id_fkey" FOREIGN KEY ("auteur_creation_id") REFERENCES "utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action" ADD CONSTRAINT "action_auteur_modification_id_fkey" FOREIGN KEY ("auteur_modification_id") REFERENCES "utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicateur_impact" ADD CONSTRAINT "indicateur_impact_mesure_id_fkey" FOREIGN KEY ("mesure_id") REFERENCES "mesure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicateur_impact" ADD CONSTRAINT "indicateur_impact_auteur_creation_id_fkey" FOREIGN KEY ("auteur_creation_id") REFERENCES "utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicateur_impact" ADD CONSTRAINT "indicateur_impact_auteur_modification_id_fkey" FOREIGN KEY ("auteur_modification_id") REFERENCES "utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pva_valeur_trimestrielle" ADD CONSTRAINT "pva_valeur_trimestrielle_indicateur_id_fkey" FOREIGN KEY ("indicateur_id") REFERENCES "indicateur_impact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pva_valeur_trimestrielle" ADD CONSTRAINT "pva_valeur_trimestrielle_soumis_par_id_fkey" FOREIGN KEY ("soumis_par_id") REFERENCES "utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pva_valeur_trimestrielle" ADD CONSTRAINT "pva_valeur_trimestrielle_traite_par_id_fkey" FOREIGN KEY ("traite_par_id") REFERENCES "utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pva_evenement" ADD CONSTRAINT "pva_evenement_pva_id_fkey" FOREIGN KEY ("pva_id") REFERENCES "pva_valeur_trimestrielle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pva_evenement" ADD CONSTRAINT "pva_evenement_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utilisateur" ADD CONSTRAINT "utilisateur_direction_id_fkey" FOREIGN KEY ("direction_id") REFERENCES "direction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habilitation_secteur" ADD CONSTRAINT "habilitation_secteur_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habilitation_secteur" ADD CONSTRAINT "habilitation_secteur_secteur_id_fkey" FOREIGN KEY ("secteur_id") REFERENCES "secteur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
