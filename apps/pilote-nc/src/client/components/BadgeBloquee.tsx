import { FormEvent, useState } from "react";
import { trpc } from "@/client/utils/trpc";
import { Modal } from "@/client/components/Modal";
import { ConfirmModal } from "@/client/components/ConfirmModal";

type ActionBloquee = {
  id: string;
  bloquee: boolean;
  raisonBlocage: string | null;
  precisionArbitrage: string | null;
};

// La raison du blocage / précision d'arbitrage peuvent être un texte long :
// une carte ancrée sous l'icône (plutôt qu'une infobulle native, tronquée et
// illisible au-delà de quelques mots) permet de l'afficher intégralement.
// Ce n'est volontairement PAS le composant `Modal` partagé : son fond plein
// écran recouvrirait l'icône dès l'ouverture, ce qui déclenche un
// `mouseleave` immédiat sur le bouton (donc une fermeture), qui redécouvre
// l'icône (donc un `mouseenter`), etc. — un clignotement en boucle. La carte
// ci-dessous ne recouvre jamais son propre déclencheur, donc le survol reste
// stable ; les gestionnaires sont posés sur le conteneur commun (icône +
// carte) pour que passer de l'un à l'autre ne ferme pas la carte non plus.
export const BoutonInfoBlocage = ({
  action,
  icone = "ℹ️",
}: {
  action: Pick<ActionBloquee, "raisonBlocage" | "precisionArbitrage">;
  icone?: string;
}) => {
  const [ouvert, setOuvert] = useState(false);

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setOuvert(true)}
      onMouseLeave={() => setOuvert(false)}
    >
      <button
        type="button"
        onClick={() => setOuvert((actuel) => !actuel)}
        aria-label="Voir la raison du blocage"
        className="cursor-pointer"
      >
        {icone}
      </button>
      {ouvert ? (
        <div
          role="tooltip"
          className="absolute left-1/2 top-full z-50 mt-2 w-72 max-h-64 -translate-x-1/2 overflow-y-auto rounded-lg border border-neutral-200 bg-white p-3 text-left text-sm font-normal normal-case text-neutral-700 shadow-lg"
        >
          <p className="font-medium text-neutral-800">Raison du blocage</p>
          <p className="mt-1 whitespace-pre-wrap">{action.raisonBlocage || "—"}</p>
          {action.precisionArbitrage ? (
            <>
              <p className="mt-3 font-medium text-neutral-800">
                Si arbitrage, précision de la demande
              </p>
              <p className="mt-1 whitespace-pre-wrap">
                {action.precisionArbitrage}
              </p>
            </>
          ) : null}
        </div>
      ) : null}
    </span>
  );
};

export const BadgeBloquee = ({
  action,
  peutGerer,
  onChanged,
}: {
  action: ActionBloquee;
  peutGerer: boolean;
  onChanged?: () => void;
}) => {
  const bascule = trpc.actions.definirBlocage.useMutation({
    onSuccess: onChanged,
  });
  const [modaleBlocageOuverte, setModaleBlocageOuverte] = useState(false);
  const [confirmationDeblocageOuverte, setConfirmationDeblocageOuverte] =
    useState(false);
  const [raisonBlocage, setRaisonBlocage] = useState("");
  const [precisionArbitrage, setPrecisionArbitrage] = useState("");

  const classes = `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
    action.bloquee ? "bg-red-100 text-red-700" : "bg-neutral-100 text-neutral-600"
  }`;

  const fermerModaleBlocage = () => {
    setModaleBlocageOuverte(false);
    setRaisonBlocage("");
    setPrecisionArbitrage("");
  };

  const soumettreBlocage = (event: FormEvent) => {
    event.preventDefault();
    if (!raisonBlocage.trim()) return;
    bascule.mutate(
      {
        id: action.id,
        bloquee: true,
        raisonBlocage,
        precisionArbitrage: precisionArbitrage || null,
      },
      { onSuccess: fermerModaleBlocage },
    );
  };

  if (!peutGerer) {
    return (
      <span className="inline-flex items-center gap-1">
        <span className={classes}>{action.bloquee ? "Oui" : "Non"}</span>
        {action.bloquee ? <BoutonInfoBlocage action={action} /> : null}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={() =>
          action.bloquee
            ? setConfirmationDeblocageOuverte(true)
            : setModaleBlocageOuverte(true)
        }
        disabled={bascule.isPending}
        title="Basculer l'état bloqué de cette action"
        className={`${classes} cursor-pointer hover:opacity-80 disabled:cursor-default disabled:opacity-50`}
      >
        {action.bloquee ? "Oui" : "Non"}
      </button>
      {action.bloquee ? <BoutonInfoBlocage action={action} /> : null}

      <Modal
        open={modaleBlocageOuverte}
        titre="Bloquer l'action"
        onFermer={fermerModaleBlocage}
      >
        <form onSubmit={soumettreBlocage} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm text-neutral-700">
            Raison du blocage
            <textarea
              value={raisonBlocage}
              onChange={(event) => setRaisonBlocage(event.target.value)}
              className="rounded border border-neutral-300 px-3 py-2"
              rows={3}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-neutral-700">
            Si arbitrage, précisez la demande
            <textarea
              value={precisionArbitrage}
              onChange={(event) => setPrecisionArbitrage(event.target.value)}
              className="rounded border border-neutral-300 px-3 py-2"
              rows={3}
            />
          </label>
          <button
            type="submit"
            disabled={bascule.isPending || !raisonBlocage.trim()}
            className="rounded bg-primary px-4 py-2 text-white hover:bg-primary-hover disabled:opacity-50"
          >
            Bloquer
          </button>
          {bascule.error ? (
            <p className="text-sm text-error">{bascule.error.message}</p>
          ) : null}
        </form>
      </Modal>

      <ConfirmModal
        open={confirmationDeblocageOuverte}
        titre="Débloquer l'action"
        message="Voulez-vous vraiment débloquer cette action ? La raison du blocage et la précision d'arbitrage seront effacées."
        libelleConfirmation="Débloquer"
        destructif={false}
        enCours={bascule.isPending}
        erreur={bascule.error?.message ?? null}
        onConfirmer={() =>
          bascule.mutate(
            {
              id: action.id,
              bloquee: false,
              raisonBlocage: null,
              precisionArbitrage: null,
            },
            { onSuccess: () => setConfirmationDeblocageOuverte(false) },
          )
        }
        onAnnuler={() => setConfirmationDeblocageOuverte(false)}
      />
    </span>
  );
};
