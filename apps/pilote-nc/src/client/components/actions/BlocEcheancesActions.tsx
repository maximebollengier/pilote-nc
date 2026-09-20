import { useMemo } from "react";
import {
  compterActionsParStatutEcheance,
  StatutEcheanceAction,
} from "@/server/actions/domain/statutEcheanceAction";

const LIGNES: { statut: StatutEcheanceAction; libelle: string; barre: string }[] = [
  { statut: "DANS_LES_TEMPS", libelle: "Dans les temps", barre: "bg-green-500" },
  { statut: "EN_RETARD", libelle: "En retard", barre: "bg-red-500" },
  { statut: "NON_DEFINI", libelle: "Non défini", barre: "bg-neutral-400" },
];

/**
 * Situation des actions par rapport à leur date de fin prévisionnelle :
 * une barre par statut, longueur = part du nombre total d'actions.
 */
export const BlocEcheancesActions = ({
  actions,
}: {
  actions: { datePrevisionnelleFin: Date | null; tauxAvancement: number }[];
}) => {
  const compteurs = useMemo(() => compterActionsParStatutEcheance(actions), [actions]);
  const total = actions.length;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-neutral-800">
        Échéance des actions
      </h2>
      <div className="flex flex-col gap-3">
        {LIGNES.map(({ statut, libelle, barre }) => {
          const nombre = compteurs[statut];
          const pourcentage = total === 0 ? 0 : (nombre / total) * 100;
          return (
            <div key={statut}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-neutral-700">{libelle}</span>
                <span className="font-medium text-neutral-800">
                  {nombre} / {total}
                </span>
              </div>
              <div
                className="mt-1 h-3 rounded-full bg-neutral-100"
                role="progressbar"
                aria-label={libelle}
                aria-valuemin={0}
                aria-valuemax={total}
                aria-valuenow={nombre}
              >
                <div
                  className={`h-3 rounded-full ${barre}`}
                  style={{ width: `${pourcentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
