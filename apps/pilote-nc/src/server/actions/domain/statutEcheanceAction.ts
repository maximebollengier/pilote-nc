export type StatutEcheanceAction = "DANS_LES_TEMPS" | "EN_RETARD" | "NON_DEFINI";

const debutDeJourUtc = (date: Date): number =>
  Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

/**
 * Situation d'une action par rapport à sa date de fin prévisionnelle.
 * Les dates d'action sont des jours calendaires (stockées à minuit UTC) : la
 * comparaison se fait au jour près, une fin égale à aujourd'hui n'est pas
 * dépassée. Une action terminée (100 %) n'est jamais en retard.
 */
export const calculerStatutEcheanceAction = (
  action: { datePrevisionnelleFin: Date | null; tauxAvancement: number },
  aujourdhui: Date = new Date(),
): StatutEcheanceAction => {
  if (!action.datePrevisionnelleFin) return "NON_DEFINI";

  const jourCourant = Date.UTC(
    aujourdhui.getFullYear(),
    aujourdhui.getMonth(),
    aujourdhui.getDate(),
  );
  const finDepassee = debutDeJourUtc(action.datePrevisionnelleFin) < jourCourant;

  return finDepassee && action.tauxAvancement < 100 ? "EN_RETARD" : "DANS_LES_TEMPS";
};

export const compterActionsParStatutEcheance = (
  actions: { datePrevisionnelleFin: Date | null; tauxAvancement: number }[],
  aujourdhui: Date = new Date(),
): Record<StatutEcheanceAction, number> => {
  const compteurs: Record<StatutEcheanceAction, number> = {
    DANS_LES_TEMPS: 0,
    EN_RETARD: 0,
    NON_DEFINI: 0,
  };
  for (const action of actions) {
    compteurs[calculerStatutEcheanceAction(action, aujourdhui)] += 1;
  }
  return compteurs;
};
