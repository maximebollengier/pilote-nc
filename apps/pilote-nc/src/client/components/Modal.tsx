import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

export const Modal = ({
  open,
  titre,
  onFermer,
  children,
}: {
  open: boolean;
  titre: string;
  onFermer: () => void;
  children: ReactNode;
}) => {
  useEffect(() => {
    if (!open) return;
    const surTouche = (event: KeyboardEvent) => {
      if (event.key === "Escape") onFermer();
    };
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [open, onFermer]);

  if (!open) return null;

  return createPortal(
    <div
      role="presentation"
      onClick={onFermer}
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titre"
        onClick={(event) => event.stopPropagation()}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-lg"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id="modal-titre" className="text-lg font-semibold text-neutral-800">
            {titre}
          </h2>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer"
            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          >
            ✕
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
};
