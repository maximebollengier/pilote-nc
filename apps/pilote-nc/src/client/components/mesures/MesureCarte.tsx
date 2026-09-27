import Link from "next/link";
import { Jauge } from "@/client/components/Jauge";
import { NombreActionsMesure } from "@/client/components/mesures/NombreActionsMesure";
import { MesureAffichage } from "@/client/types/mesure";

export const MesureCarte = ({ mesure }: { mesure: MesureAffichage }) => (
  <Link
    href={`/mesure/${mesure.id}`}
    className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-5 hover:border-primary sm:flex-row sm:items-center sm:justify-between sm:gap-6"
  >
    <div className="min-w-0">
      <h2 className="font-medium text-neutral-800">{mesure.titre}</h2>
    </div>
    <div className="flex justify-around gap-6 sm:shrink-0 sm:justify-start">
      <NombreActionsMesure nombre={mesure.nombreActions} />
      <Jauge libelle="Avancement des actions" valeur={mesure.meteoAvancement} />
      <Jauge
        libelle="Avancement des indicateurs"
        valeur={mesure.tauxAvancementIndicateurs}
      />
    </div>
  </Link>
);
