-- CreateTable
CREATE TABLE "mesure_co_porteur" (
    "mesure_id" UUID NOT NULL,
    "secteur_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mesure_co_porteur_pkey" PRIMARY KEY ("mesure_id","secteur_id")
);

-- AddForeignKey
ALTER TABLE "mesure_co_porteur" ADD CONSTRAINT "mesure_co_porteur_mesure_id_fkey" FOREIGN KEY ("mesure_id") REFERENCES "mesure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesure_co_porteur" ADD CONSTRAINT "mesure_co_porteur_secteur_id_fkey" FOREIGN KEY ("secteur_id") REFERENCES "secteur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
