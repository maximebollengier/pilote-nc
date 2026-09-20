import Link from "next/link";
import { Modal } from "@/client/components/Modal";

export type ActionCliquable = {
  id: string;
  titre: string;
  mesureId: string;
  mesureTitre?: string;
  tauxAvancement: number;
  datePrevisionnelleFin: Date | null;
};

export type SelectionActions = { titre: string; actions: ActionCliquable[] };

/**
 * Liste d'actions ; chaque ligne mène à la mesure qui contient l'action.
 */
export const ModaleListeActions = ({
  selection,
  onFermer,
}: {
  selection: SelectionActions | null;
  onFermer: () => void;
}) => (
  <Modal open={selection !== null} titre={selection?.titre ?? ""} onFermer={onFermer}>
    <ul className="divide-y divide-neutral-100">
      {selection?.actions.map((action) => (
        <li key={action.id}>
          <Link
            href={`/mesure/${action.mesureId}`}
            className="flex items-center justify-between gap-4 rounded px-2 py-3 hover:bg-neutral-50"
          >
            <span className="min-w-0">
              <span className="block truncate font-medium text-neutral-800">
                {action.titre}
              </span>
              <span className="block truncate text-sm text-neutral-500">
                Mesure : {action.mesureTitre ?? "—"}
              </span>
            </span>
            <span className="shrink-0 text-sm text-neutral-600">
              {Math.round(action.tauxAvancement)} % →
            </span>
          </Link>
        </li>
      ))}
    </ul>
  </Modal>
);
