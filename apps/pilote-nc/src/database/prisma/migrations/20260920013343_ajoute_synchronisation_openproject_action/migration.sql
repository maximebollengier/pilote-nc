-- CreateEnum
CREATE TYPE "SourceAvancementAction" AS ENUM ('MANUELLE', 'OPENPROJECT');

-- CreateEnum
CREATE TYPE "StatutSynchronisationAction" AS ENUM ('JAMAIS_SYNCHRONISEE', 'SYNCHRONISEE', 'EN_ERREUR');

-- AlterTable
ALTER TABLE "action" ADD COLUMN     "date_derniere_synchronisation" TIMESTAMP(3),
ADD COLUMN     "erreur_synchronisation" TEXT,
ADD COLUMN     "nombre_taches_synchronisees" INTEGER,
ADD COLUMN     "openproject_lot_travail_id" TEXT,
ADD COLUMN     "openproject_projet_id" TEXT,
ADD COLUMN     "source_avancement" "SourceAvancementAction" NOT NULL DEFAULT 'MANUELLE',
ADD COLUMN     "statut_synchronisation" "StatutSynchronisationAction" NOT NULL DEFAULT 'JAMAIS_SYNCHRONISEE';

-- CreateIndex
CREATE INDEX "action_source_avancement_idx" ON "action"("source_avancement");
