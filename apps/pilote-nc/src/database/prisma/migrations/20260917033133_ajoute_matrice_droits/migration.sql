-- CreateEnum
CREATE TYPE "ActionDroit" AS ENUM ('MESURE_CREER', 'MESURE_MODIFIER', 'MESURE_MODIFIER_STATUT', 'MESURE_MODIFIER_PHASE', 'ACTION_CREER', 'ACTION_MODIFIER', 'ACTION_SUPPRIMER', 'INDICATEUR_CREER');

-- CreateTable
CREATE TABLE "droit" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "action" "ActionDroit" NOT NULL,
    "profil" "ProfilEnum" NOT NULL,
    "autorise" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "droit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "droit_action_profil_key" ON "droit"("action", "profil");
