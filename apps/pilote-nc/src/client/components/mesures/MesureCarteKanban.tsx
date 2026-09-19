import Link from "next/link";
import { BarreAvancement } from "@/client/components/BarreAvancement";
import { MesureAffichage } from "@/client/types/mesure";

export const MesureCarteKanban = ({ mesure }: { mesure: MesureAffichage }) => (
  <Link
    href={`/mesure/${mesure.id}`}
    draggable={false}
    className="block rounded-lg border border-neutral-200 bg-white p-3 hover:border-primary"
  >
    <h3 className="text-sm font-medium text-neutral-800">{mesure.titre}</h3>
    <div className="mt-3 flex flex-col gap-2">
      <div>
        <p className="text-[11px] text-neutral-500">Avancement des actions</p>
        <BarreAvancement valeur={mesure.meteoAvancement} />
      </div>
      <div>
        <p className="text-[11px] text-neutral-500">Avancement des indicateurs</p>
        <BarreAvancement valeur={mesure.tauxAvancementIndicateurs} />
      </div>
    </div>
  </Link>
);
