import { FormEvent, useState } from "react";
import { trpc } from "@/client/utils/trpc";

const trimestreCourant = () => Math.floor(new Date().getMonth() / 3) + 1;

export const FormulaireSoumissionPva = ({
  indicateurId,
}: {
  indicateurId: string;
}) => {
  const utils = trpc.useContext();
  const soumettre = trpc.propositionValeurAvancement.soumettre.useMutation({
    onSuccess: () => utils.indicateursImpact.listerParMesure.invalidate(),
  });
  const [annee, setAnnee] = useState(String(new Date().getFullYear()));
  const [trimestre, setTrimestre] = useState(String(trimestreCourant()));
  const [valeur, setValeur] = useState("");

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    soumettre.mutate(
      {
        indicateurId,
        annee: Number(annee),
        trimestre: Number(trimestre),
        valeurProposee: Number(valeur),
      },
      { onSuccess: () => setValeur("") },
    );
  };

  return (
    <form onSubmit={onSubmit} className="mt-2 flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-xs text-neutral-600">
        Année
        <input
          type="number"
          value={annee}
          onChange={(event) => setAnnee(event.target.value)}
          className="w-24 rounded border border-neutral-300 px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-neutral-600">
        Trimestre
        <select
          value={trimestre}
          onChange={(event) => setTrimestre(event.target.value)}
          className="rounded border border-neutral-300 px-2 py-1"
        >
          {[1, 2, 3, 4].map((numero) => (
            <option key={numero} value={numero}>
              T{numero}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-neutral-600">
        Valeur constatée
        <input
          type="number"
          value={valeur}
          onChange={(event) => setValeur(event.target.value)}
          className="w-32 rounded border border-neutral-300 px-2 py-1"
        />
      </label>
      <button
        type="submit"
        disabled={soumettre.isPending || valeur === ""}
        className="rounded bg-primary px-3 py-1.5 text-sm text-white hover:bg-primary-hover disabled:opacity-50"
      >
        Soumettre au SG
      </button>
      {soumettre.isSuccess ? (
        <span className="text-sm text-success">
          Envoyée — en attente de validation SG.
        </span>
      ) : null}
      {soumettre.error ? (
        <p className="w-full text-sm text-error">{soumettre.error.message}</p>
      ) : null}
    </form>
  );
};
