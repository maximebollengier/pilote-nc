import { useEffect } from "react";
import { createPortal } from "react-dom";

export const ConfirmModal = ({
  open,
  titre,
  message,
  libelleConfirmation = "Confirmer",
  enCours = false,
  destructif = true,
  erreur = null,
  onConfirmer,
  onAnnuler,
}: {
  open: boolean;
  titre: string;
  message: string;
  libelleConfirmation?: string;
  enCours?: boolean;
  destructif?: boolean;
  erreur?: string | null;
  onConfirmer: () => void;
  onAnnuler: () => void;
}) => {
  useEffect(() => {
    if (!open) return;
    const surTouche = (event: KeyboardEvent) => {
      if (event.key === "Escape") onAnnuler();
    };
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [open, onAnnuler]);

  if (!open) return null;

  // Portail vers `document.body` : ce composant est souvent instancié depuis
  // l'intérieur d'un <tr>/<td>, où un <div> plein écran serait une position
  // HTML invalide (et cassée visuellement, coincée dans la cellule).
  return createPortal(
    <div
      role="presentation"
      onClick={onAnnuler}
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-titre"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg"
      >
        <h2 id="confirm-modal-titre" className="text-lg font-semibold text-neutral-800">
          {titre}
        </h2>
        <p className="mt-2 text-sm text-neutral-600">{message}</p>
        {erreur ? <p className="mt-3 text-sm text-error">{erreur}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onAnnuler}
            disabled={enCours}
            className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirmer}
            disabled={enCours}
            className={
              destructif
                ? "rounded bg-error px-3 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50"
                : "rounded bg-primary px-3 py-1.5 text-sm text-white hover:bg-primary-hover disabled:opacity-50"
            }
          >
            {enCours ? "…" : libelleConfirmation}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
