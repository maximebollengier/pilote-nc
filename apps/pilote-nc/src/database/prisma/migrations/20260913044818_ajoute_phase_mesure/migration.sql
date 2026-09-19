-- CreateEnum
CREATE TYPE "PhaseMesure" AS ENUM ('AN_1', 'PLUS_TARD');

-- AlterTable
ALTER TABLE "mesure" ADD COLUMN     "phase" "PhaseMesure" NOT NULL DEFAULT 'AN_1';
