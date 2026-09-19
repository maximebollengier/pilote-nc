import { SensEvolution } from "@/server/indicateurs-impact/domain/SensEvolution";

/**
 * Taux de réalisation d'un indicateur d'impact : proportion du chemin vers la
 * cible déjà parcourue, en pourcentage.
 *
 * - À la hausse (le succès, c'est une valeur qui augmente) :
 *     (valeurActuelle - valeurInitiale) / (valeurCible - valeurInitiale) * 100
 * - À la baisse (le succès, c'est une valeur qui diminue) : mêmes termes mais
 *   inversés, pour que le résultat reste un pourcentage positif qui progresse
 *   vers 100 dans les deux cas :
 *     (valeurInitiale - valeurActuelle) / (valeurInitiale - valeurCible) * 100
 *
 * Retourne `null` tant qu'aucune valeur actuelle n'est encore connue.
 * Pas de plafond à 100 ici : une sur-performance réelle doit rester visible,
 * le plafonnage éventuel est une décision d'affichage, pas de calcul.
 */
export function calculerTauxRealisation(params: {
  valeurInitiale: number;
  valeurCible: number;
  valeurActuelle: number | null;
  sensEvolution: SensEvolution;
}): number | null {
  const { valeurInitiale, valeurCible, valeurActuelle, sensEvolution } =
    params;

  if (valeurActuelle === null) return null;

  const progresRealise =
    sensEvolution === "A_LA_HAUSSE"
      ? valeurActuelle - valeurInitiale
      : valeurInitiale - valeurActuelle;

  const progresAttendu =
    sensEvolution === "A_LA_HAUSSE"
      ? valeurCible - valeurInitiale
      : valeurInitiale - valeurCible;

  if (progresAttendu === 0) return null;

  return (progresRealise / progresAttendu) * 100;
}

/**
 * Un indicateur "à la hausse" doit avoir une cible supérieure à sa valeur
 * initiale (et l'inverse pour "à la baisse"), sinon la formule ci-dessus
 * produit un dénominateur négatif ou nul et le taux perd son sens.
 */
export function valeurCibleEstCoherenteAvecSensEvolution(params: {
  valeurInitiale: number;
  valeurCible: number;
  sensEvolution: SensEvolution;
}): boolean {
  return params.sensEvolution === "A_LA_HAUSSE"
    ? params.valeurCible > params.valeurInitiale
    : params.valeurCible < params.valeurInitiale;
}
