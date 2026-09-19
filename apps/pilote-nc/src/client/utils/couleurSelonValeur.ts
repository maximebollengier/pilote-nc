/**
 * Seuils RAG (rouge/orange/vert) partagés par tous les indicateurs
 * d'avancement affichés côté client : sous 40% jugé insuffisant, entre 40 et
 * 70% en bonne voie, au-delà satisfaisant.
 */
export function couleurSelonValeur(pourcentage: number): {
  anneau: string;
  texte: string;
  barre: string;
} {
  if (pourcentage < 40) {
    return { anneau: "text-red-500", texte: "text-red-600", barre: "bg-red-500" };
  }
  if (pourcentage < 70) {
    return { anneau: "text-amber-500", texte: "text-amber-600", barre: "bg-amber-500" };
  }
  return { anneau: "text-green-600", texte: "text-green-700", barre: "bg-green-600" };
}
