/*
  Warnings:

  - Added the required column `mesure_prioritaire` to the `mesure` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MesurePrioritaire" AS ENUM ('MAITRISE_DEPENSES_PUBLIQUES_ET_EXEMPLARITE', 'SAUVEGARDE_REGIMES_SOCIAUX', 'REFORME_RETRAITES_SECTEUR_PRIVE', 'FISCALITE_ET_RELANCE_ECONOMIQUE', 'POUVOIR_ACHAT_ET_URGENCE_SOCIALE');

-- AlterTable
ALTER TABLE "mesure" ADD COLUMN     "mesure_prioritaire" "MesurePrioritaire" NOT NULL;

-- CreateIndex
CREATE INDEX "mesure_mesure_prioritaire_idx" ON "mesure"("mesure_prioritaire");
