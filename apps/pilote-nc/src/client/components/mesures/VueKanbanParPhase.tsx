import { DragEvent, useState } from "react";
import { trpc } from "@/client/utils/trpc";
import { MesureCarteKanban } from "@/client/components/mesures/MesureCarteKanban";
import { MesureAffichage } from "@/client/types/mesure";
import {
  LIBELLES_STATUT_MESURE,
  ORDRE_STATUT_MESURE,
  StatutMesure,
} from "@/server/mesures/domain/StatutMesure";
import { LIBELLES_PHASE_MESURE, PhaseMesure } from "@/server/mesures/domain/PhaseMesure";

const PHASES_TRIEES_ALPHABETIQUEMENT = (
  Object.keys(LIBELLES_PHASE_MESURE) as PhaseMesure[]
).sort((a, b) => LIBELLES_PHASE_MESURE[a].localeCompare(LIBELLES_PHASE_MESURE[b]));

export const VueKanbanParPhase = ({
  mesures,
  peutDeplacer = false,
}: {
  mesures: MesureAffichage[];
  peutDeplacer?: boolean;
}) => {
  const utils = trpc.useContext();
  const modifierStatut = trpc.mesures.modifierStatut.useMutation({
    onSuccess: () => utils.mesures.lister.invalidate(),
  });
  const [colonneSurvolee, setColonneSurvolee] = useState<string | null>(null);

  const mesuresParPhase = mesures.reduce<Record<string, MesureAffichage[]>>(
    (groupes, mesure) => {
      (groupes[mesure.phase] ??= []).push(mesure);
      return groupes;
    },
    {},
  );

  const demarrerDeplacement = (mesureId: string) => (event: DragEvent) => {
    event.dataTransfer.setData("text/plain", mesureId);
    event.dataTransfer.effectAllowed = "move";
  };

  const survolerColonne = (cléColonne: string) => (event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setColonneSurvolee(cléColonne);
  };

  const quitterColonne = (cléColonne: string) => () => {
    setColonneSurvolee((actuelle) => (actuelle === cléColonne ? null : actuelle));
  };

  const deposerSurColonne = (statut: StatutMesure) => (event: DragEvent) => {
    event.preventDefault();
    setColonneSurvolee(null);
    const mesureId = event.dataTransfer.getData("text/plain");
    if (!mesureId) return;
    modifierStatut.mutate({ id: mesureId, statut });
  };

  return (
    <div className="flex flex-col gap-6">
      {PHASES_TRIEES_ALPHABETIQUEMENT.map((phase) => {
        const mesuresDeLaPhase = mesuresParPhase[phase] ?? [];
        const mesuresParStatut = mesuresDeLaPhase.reduce<
          Record<string, MesureAffichage[]>
        >((groupes, mesure) => {
          (groupes[mesure.statut] ??= []).push(mesure);
          return groupes;
        }, {});

        return (
          <div
            key={phase}
            className="rounded-lg border border-neutral-200 bg-white p-4"
          >
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {LIBELLES_PHASE_MESURE[phase]}{" "}
              <span className="text-neutral-400">
                ({mesuresDeLaPhase.length})
              </span>
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {ORDRE_STATUT_MESURE.map((statut) => {
                const mesuresDuGroupe = mesuresParStatut[statut] ?? [];
                const cléColonne = `${phase}:${statut}`;
                const survolee = colonneSurvolee === cléColonne;

                return (
                  <div
                    key={statut}
                    onDragOver={peutDeplacer ? survolerColonne(cléColonne) : undefined}
                    onDragLeave={peutDeplacer ? quitterColonne(cléColonne) : undefined}
                    onDrop={peutDeplacer ? deposerSurColonne(statut) : undefined}
                    className={`flex w-72 shrink-0 flex-col gap-3 rounded-lg p-3 transition-colors ${
                      survolee ? "bg-primary/10 ring-2 ring-primary" : "bg-neutral-100"
                    }`}
                  >
                    <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      {LIBELLES_STATUT_MESURE[statut]}{" "}
                      <span className="text-neutral-400">
                        ({mesuresDuGroupe.length})
                      </span>
                    </h3>
                    <div className="flex flex-col gap-2">
                      {mesuresDuGroupe.map((mesure) => (
                        <div
                          key={mesure.id}
                          draggable={peutDeplacer}
                          onDragStart={
                            peutDeplacer ? demarrerDeplacement(mesure.id) : undefined
                          }
                          className={peutDeplacer ? "cursor-grab active:cursor-grabbing" : undefined}
                        >
                          <MesureCarteKanban mesure={mesure} />
                        </div>
                      ))}
                      {mesuresDuGroupe.length === 0 ? (
                        <p className="px-1 text-xs text-neutral-400">
                          Aucune mesure
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
