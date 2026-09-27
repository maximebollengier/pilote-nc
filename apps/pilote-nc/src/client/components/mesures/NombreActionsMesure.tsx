const TAILLE_PAR_DEFAUT = 64;

/**
 * Nombre d'actions d'une mesure, visibles par l'utilisateur connecté (une
 * action est toujours visible dès lors que sa mesure l'est). Même gabarit que
 * `Jauge` pour s'aligner avec elle dans les cartes, mais sans anneau de
 * progression puisqu'il ne s'agit pas d'un pourcentage.
 */
export const NombreActionsMesure = ({
  nombre,
  taille = TAILLE_PAR_DEFAUT,
}: {
  nombre: number;
  taille?: number;
}) => {
  const centre = taille / 2;
  const rayon = taille * (26 / 64);
  const epaisseurTrait = taille * (6 / 64);
  const tailleTexte = taille * (13 / 64);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={taille} height={taille} viewBox={`0 0 ${taille} ${taille}`}>
        <circle
          cx={centre}
          cy={centre}
          r={rayon}
          fill="none"
          stroke="currentColor"
          strokeWidth={epaisseurTrait}
          className="text-neutral-200"
        />
        <text
          x={centre}
          y={centre + taille * 0.0625}
          textAnchor="middle"
          fontSize={tailleTexte}
          fill="currentColor"
          className="text-neutral-700"
        >
          {nombre}
        </text>
      </svg>
      <span className="max-w-[80px] text-center text-[11px] leading-tight text-neutral-500">
        Nombre d&apos;actions
      </span>
    </div>
  );
};
