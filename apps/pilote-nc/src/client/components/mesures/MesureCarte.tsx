import Link from "next/link";
import { Jauge } from "@/client/components/Jauge";
import { MesureAffichage } from "@/client/types/mesure";

export const MesureCarte = ({ mesure }: { mesure: MesureAffichage }) => (
  <Link
    href={`/mesure/${mesure.id}`}
    className="flex items-center justify-between gap-6 rounded-lg border border-neutral-200 bg-white p-5 hover:border-primary"
  >
    <div className="min-w-0">
      <h2 className="font-medium text-neutral-800">{mesure.titre}</h2>
    </div>
    <div className="flex shrink-0 gap-6">
      <Jauge libelle="Avancement des actions" valeur={mesure.meteoAvancement} />
      <Jauge
        libelle="Avancement des indicateurs"
        valeur={mesure.tauxAvancementIndicateurs}
      />
    </div>
  </Link>
);
