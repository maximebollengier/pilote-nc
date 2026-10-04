import { couleurSelonValeur } from "@/client/utils/couleurSelonValeur";

/**
 * Variante compacte de la Jauge (barre horizontale + pourcentage), pour les
 * contextes où l'anneau circulaire est trop encombrant (tableau, Kanban).
 * `valeur` à `null` signifie que le taux n'est pas calculable.
 */
export const BarreAvancement = ({
  valeur,
  afficherValeur = true,
}: {
  valeur: number | null;
  afficherValeur?: boolean;
}) => {
  if (valeur === null) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-2 w-20 rounded-full bg-neutral-100" />
        {afficherValeur ? <span className="text-xs text-neutral-600">—</span> : null}
      </div>
    );
  }

  const pourcentage = Math.max(0, Math.min(100, valeur));
  const couleur = couleurSelonValeur(pourcentage);

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 rounded-full bg-neutral-100">
        <div
          className={`h-2 rounded-full ${couleur.barre}`}
          style={{ width: `${pourcentage}%` }}
        />
      </div>
      {afficherValeur ? (
        <span className={`text-xs font-medium ${couleur.texte}`}>
          {Math.round(pourcentage)}%
        </span>
      ) : null}
    </div>
  );
};
