/**
 * Météo de la Mesure : moyenne du taux d'avancement des Actions liées.
 * `null` quand la Mesure n'a aucune Action (pas de division par zéro,
 * pas de valeur arbitraire).
 */
export function calculerMeteoAvancement(
  tauxAvancementActions: number[],
): number | null {
  if (tauxAvancementActions.length === 0) return null;

  const somme = tauxAvancementActions.reduce((total, taux) => total + taux, 0);
  return somme / tauxAvancementActions.length;
}
