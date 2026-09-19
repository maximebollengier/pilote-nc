/**
 * Taux d'avancement des indicateurs d'impact d'une Mesure : moyenne des
 * `tauxRealisation` de ses indicateurs. `null` si la Mesure n'a aucun
 * indicateur, ou si aucun de ses indicateurs n'a encore de taux de
 * réalisation calculable (pas de valeur actuelle connue).
 */
export function calculerTauxAvancementIndicateurs(
  tauxRealisationIndicateurs: (number | null)[],
): number | null {
  const tauxConnus = tauxRealisationIndicateurs.filter(
    (taux): taux is number => taux !== null,
  );
  if (tauxConnus.length === 0) return null;

  const somme = tauxConnus.reduce((total, taux) => total + taux, 0);
  return somme / tauxConnus.length;
}
