/*
  Warnings:

  - The values [ARBITRAGE_EN_COURS,PROGRAMMEE,EN_COURS,EN_ALERTE,ACHEVEE] on the enum `StatutMesure` will be removed. Existing rows have already been remapped (ARBITRAGE_EN_COURS -> A_L_ETUDE ; PROGRAMMEE, EN_COURS, EN_ALERTE, ACHEVEE -> ACTEE) before applying this migration.

*/
BEGIN;
CREATE TYPE "StatutMesure_new" AS ENUM ('A_L_ETUDE', 'ACTEE', 'ABANDONNEE');
ALTER TABLE "mesure" ALTER COLUMN "statut" DROP DEFAULT;
ALTER TABLE "mesure" ALTER COLUMN "statut" TYPE "StatutMesure_new" USING ("statut"::text::"StatutMesure_new");
ALTER TYPE "StatutMesure" RENAME TO "StatutMesure_old";
ALTER TYPE "StatutMesure_new" RENAME TO "StatutMesure";
DROP TYPE "StatutMesure_old";
ALTER TABLE "mesure" ALTER COLUMN "statut" SET DEFAULT 'A_L_ETUDE';
COMMIT;
