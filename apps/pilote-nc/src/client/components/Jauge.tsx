import { couleurSelonValeur } from "@/client/utils/couleurSelonValeur";

const TAILLE_PAR_DEFAUT = 64;

type JaugeProps = {
  libelle?: string;
  valeur: number | null;
  taille?: number;
};

/**
 * Jauge circulaire. `valeur` à `null` signifie que le taux n'est pas
 * calculable (aucune action / aucun indicateur avec une valeur connue) :
 * la jauge s'affiche alors désactivée, sans anneau de progression.
 * Sinon, l'anneau et le pourcentage sont colorés selon des seuils RAG.
 * `libelle` est optionnel : omis, aucun texte n'est affiché sous la jauge
 * (utile quand le titre est déjà porté par un élément englobant).
 * Toutes les mesures de l'anneau/du texte sont dérivées de `taille` pour
 * garder les proportions d'origine (64px) quelle que soit la taille demandée.
 */
export const Jauge = ({ libelle, valeur, taille = TAILLE_PAR_DEFAUT }: JaugeProps) => {
  const centre = taille / 2;
  const rayon = taille * (26 / 64);
  const circonference = 2 * Math.PI * rayon;
  const epaisseurTrait = taille * (6 / 64);
  const tailleTexte = taille * (13 / 64);
  const desactivee = valeur === null;
  const pourcentage = desactivee ? 0 : Math.max(0, Math.min(100, valeur));
  const decalage = circonference - (pourcentage / 100) * circonference;
  const couleur = couleurSelonValeur(pourcentage);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        width={taille}
        height={taille}
        viewBox={`0 0 ${taille} ${taille}`}
        className={desactivee ? "opacity-40" : undefined}
      >
        <circle
          cx={centre}
          cy={centre}
          r={rayon}
          fill="none"
          stroke="currentColor"
          strokeWidth={epaisseurTrait}
          className="text-neutral-200"
        />
        {!desactivee ? (
          <circle
            cx={centre}
            cy={centre}
            r={rayon}
            fill="none"
            stroke="currentColor"
            strokeWidth={epaisseurTrait}
            strokeLinecap="round"
            strokeDasharray={circonference}
            strokeDashoffset={decalage}
            transform={`rotate(-90 ${centre} ${centre})`}
            className={couleur.anneau}
          />
        ) : null}
        <text
          x={centre}
          y={centre + taille * 0.0625}
          textAnchor="middle"
          fontSize={tailleTexte}
          fill="currentColor"
          className={desactivee ? "text-neutral-400" : couleur.texte}
        >
          {desactivee ? "—" : `${Math.round(pourcentage)}%`}
        </text>
      </svg>
      {libelle ? (
        <span className="max-w-[80px] text-center text-[11px] leading-tight text-neutral-500">
          {libelle}
        </span>
      ) : null}
    </div>
  );
};
