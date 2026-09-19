import { MesureCarte } from "@/client/components/mesures/MesureCarte";
import { MesureAffichage } from "@/client/types/mesure";
import {
  LIBELLES_MESURE_PRIORITAIRE,
  ORDRE_MESURE_PRIORITAIRE,
} from "@/server/mesures/domain/MesurePrioritaire";

export const VueListe = ({ mesures }: { mesures: MesureAffichage[] }) => {
  const mesuresParPrioritaire = mesures.reduce<Record<string, MesureAffichage[]>>(
    (groupes, mesure) => {
      (groupes[mesure.mesurePrioritaire] ??= []).push(mesure);
      return groupes;
    },
    {},
  );

  return (
    <div className="flex flex-col gap-8">
      {ORDRE_MESURE_PRIORITAIRE.map((valeur) => {
        const mesuresDuGroupe = mesuresParPrioritaire[valeur];
        if (!mesuresDuGroupe || mesuresDuGroupe.length === 0) return null;

        return (
          <div key={valeur}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
              {LIBELLES_MESURE_PRIORITAIRE[valeur]}
            </h2>
            <div className="flex flex-col gap-4">
              {mesuresDuGroupe.map((mesure) => (
                <MesureCarte key={mesure.id} mesure={mesure} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
