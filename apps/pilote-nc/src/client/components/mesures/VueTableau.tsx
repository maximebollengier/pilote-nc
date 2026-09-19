import Link from "next/link";
import { useMemo, useState } from "react";
import { BarreAvancement } from "@/client/components/BarreAvancement";
import { MesureAffichage } from "@/client/types/mesure";
import {
  LIBELLES_MESURE_PRIORITAIRE,
  ORDRE_MESURE_PRIORITAIRE,
} from "@/server/mesures/domain/MesurePrioritaire";

type Colonne =
  | "titre"
  | "mesurePrioritaire"
  | "meteoAvancement"
  | "tauxAvancementIndicateurs";

const COLONNES: { cle: Colonne; libelle: string }[] = [
  { cle: "titre", libelle: "Mesure" },
  { cle: "mesurePrioritaire", libelle: "Mesure prioritaire" },
  { cle: "meteoAvancement", libelle: "Avancement des actions" },
  { cle: "tauxAvancementIndicateurs", libelle: "Avancement des indicateurs" },
];

// Les valeurs non calculables restent en dernier, quel que soit le sens du tri.
function comparerNombreNullable(
  a: number | null,
  b: number | null,
  croissant: boolean,
): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return croissant ? a - b : b - a;
}

function comparerMesures(
  a: MesureAffichage,
  b: MesureAffichage,
  colonne: Colonne,
  croissant: boolean,
): number {
  switch (colonne) {
    case "titre":
      return a.titre.localeCompare(b.titre) * (croissant ? 1 : -1);
    case "mesurePrioritaire":
      return (
        (ORDRE_MESURE_PRIORITAIRE.indexOf(a.mesurePrioritaire) -
          ORDRE_MESURE_PRIORITAIRE.indexOf(b.mesurePrioritaire)) *
        (croissant ? 1 : -1)
      );
    case "meteoAvancement":
      return comparerNombreNullable(a.meteoAvancement, b.meteoAvancement, croissant);
    case "tauxAvancementIndicateurs":
      return comparerNombreNullable(
        a.tauxAvancementIndicateurs,
        b.tauxAvancementIndicateurs,
        croissant,
      );
  }
}

export const VueTableau = ({ mesures }: { mesures: MesureAffichage[] }) => {
  const [tri, setTri] = useState<{ colonne: Colonne; croissant: boolean }>({
    colonne: "titre",
    croissant: true,
  });

  const basculerTri = (colonne: Colonne) => {
    setTri((triActuel) =>
      triActuel.colonne === colonne
        ? { colonne, croissant: !triActuel.croissant }
        : { colonne, croissant: true },
    );
  };

  const mesuresTriees = useMemo(
    () =>
      [...mesures].sort((a, b) =>
        comparerMesures(a, b, tri.colonne, tri.croissant),
      ),
    [mesures, tri],
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead className="bg-neutral-100 text-left text-neutral-600">
          <tr>
            {COLONNES.map((colonne) => (
              <th key={colonne.cle} className="px-4 py-2">
                <button
                  type="button"
                  onClick={() => basculerTri(colonne.cle)}
                  className="flex items-center gap-1 font-medium hover:text-neutral-900"
                >
                  {colonne.libelle}
                  <span className="text-xs text-neutral-400">
                    {tri.colonne === colonne.cle
                      ? tri.croissant
                        ? "▲"
                        : "▼"
                      : "↕"}
                  </span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {mesuresTriees.map((mesure) => (
            <tr key={mesure.id} className="border-t border-neutral-100">
              <td className="px-4 py-2">
                <Link
                  href={`/mesure/${mesure.id}`}
                  className="text-primary hover:underline"
                >
                  {mesure.titre}
                </Link>
              </td>
              <td className="px-4 py-2 text-neutral-600">
                {LIBELLES_MESURE_PRIORITAIRE[mesure.mesurePrioritaire]}
              </td>
              <td className="px-4 py-2">
                <BarreAvancement valeur={mesure.meteoAvancement} />
              </td>
              <td className="px-4 py-2">
                <BarreAvancement valeur={mesure.tauxAvancementIndicateurs} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
