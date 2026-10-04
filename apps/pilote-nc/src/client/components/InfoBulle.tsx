import { ReactNode, useId } from "react";

/**
 * Icône d'aide « ? » qui affiche une explication au survol ou au focus
 * clavier. Échap retire le focus (et donc ferme la bulle ouverte au clavier).
 * Masquée à l'impression : l'explication n'a de sens qu'à l'écran.
 */
export const InfoBulle = ({
  libelle,
  children,
}: {
  libelle: string;
  children: ReactNode;
}) => {
  const id = useId();

  return (
    <span className="group relative inline-flex print:hidden">
      <button
        type="button"
        aria-label={libelle}
        aria-describedby={id}
        onKeyDown={(event) => {
          if (event.key === "Escape") event.currentTarget.blur();
        }}
        className="flex h-5 w-5 items-center justify-center rounded-full border border-neutral-600 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        ?
      </button>
      <span
        id={id}
        role="tooltip"
        className="invisible absolute left-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-3rem)] rounded-lg border border-neutral-200 bg-white p-3 text-left text-sm font-normal text-neutral-700 shadow-lg group-hover:visible group-focus-within:visible"
      >
        {children}
      </span>
    </span>
  );
};
