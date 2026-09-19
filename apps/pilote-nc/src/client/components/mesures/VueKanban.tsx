import { MesureCarteKanban } from "@/client/components/mesures/MesureCarteKanban";
import { MesureAffichage } from "@/client/types/mesure";
import {
  LIBELLES_MESURE_PRIORITAIRE,
  ORDRE_MESURE_PRIORITAIRE,
} from "@/server/mesures/domain/MesurePrioritaire";

export const VueKanban = ({ mesures }: { mesures: MesureAffichage[] }) => {
  const mesuresParPrioritaire = mesures.reduce<Record<string, MesureAffichage[]>>(
    (groupes, mesure) => {
      (groupes[mesure.mesurePrioritaire] ??= []).push(mesure);
      return groupes;
    },
    {},
  );

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {ORDRE_MESURE_PRIORITAIRE.map((valeur) => {
        const mesuresDuGroupe = mesuresParPrioritaire[valeur] ?? [];

        return (
          <div
            key={valeur}
            className="flex w-72 shrink-0 flex-col gap-3 rounded-lg bg-neutral-100 p-3"
          >
            <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {LIBELLES_MESURE_PRIORITAIRE[valeur]}{" "}
              <span className="text-neutral-400">({mesuresDuGroupe.length})</span>
            </h2>
            <div className="flex flex-col gap-2">
              {mesuresDuGroupe.map((mesure) => (
                <MesureCarteKanban key={mesure.id} mesure={mesure} />
              ))}
              {mesuresDuGroupe.length === 0 ? (
                <p className="px-1 text-xs text-neutral-400">Aucune mesure</p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};
