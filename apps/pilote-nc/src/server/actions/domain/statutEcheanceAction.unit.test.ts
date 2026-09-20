import { describe, expect, it } from "vitest";
import {
  calculerStatutEcheanceAction,
  compterActionsParStatutEcheance,
} from "./statutEcheanceAction";

const aujourdhui = new Date(2026, 8, 20, 15, 30); // 20/09/2026, heure locale
const jour = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe("calculerStatutEcheanceAction", () => {
  it("est non défini quand la date de fin est absente", () => {
    expect(
      calculerStatutEcheanceAction(
        { datePrevisionnelleFin: null, tauxAvancement: 40 },
        aujourdhui,
      ),
    ).toBe("NON_DEFINI");
  });

  it("est dans les temps quand la fin est dans le futur", () => {
    expect(
      calculerStatutEcheanceAction(
        { datePrevisionnelleFin: jour("2026-12-31"), tauxAvancement: 10 },
        aujourdhui,
      ),
    ).toBe("DANS_LES_TEMPS");
  });

  it("est dans les temps le jour même de la date de fin", () => {
    expect(
      calculerStatutEcheanceAction(
        { datePrevisionnelleFin: jour("2026-09-20"), tauxAvancement: 10 },
        aujourdhui,
      ),
    ).toBe("DANS_LES_TEMPS");
  });

  it("est en retard quand la fin est dépassée et l'avancement inférieur à 100", () => {
    expect(
      calculerStatutEcheanceAction(
        { datePrevisionnelleFin: jour("2026-09-19"), tauxAvancement: 99 },
        aujourdhui,
      ),
    ).toBe("EN_RETARD");
  });

  it("n'est pas en retard quand la fin est dépassée mais l'action est terminée", () => {
    expect(
      calculerStatutEcheanceAction(
        { datePrevisionnelleFin: jour("2026-01-31"), tauxAvancement: 100 },
        aujourdhui,
      ),
    ).toBe("DANS_LES_TEMPS");
  });
});

describe("compterActionsParStatutEcheance", () => {
  it("répartit les actions entre les trois statuts", () => {
    expect(
      compterActionsParStatutEcheance(
        [
          { datePrevisionnelleFin: null, tauxAvancement: 0 },
          { datePrevisionnelleFin: jour("2026-12-31"), tauxAvancement: 0 },
          { datePrevisionnelleFin: jour("2026-01-01"), tauxAvancement: 50 },
          { datePrevisionnelleFin: jour("2026-01-01"), tauxAvancement: 60 },
        ],
        aujourdhui,
      ),
    ).toEqual({ DANS_LES_TEMPS: 1, EN_RETARD: 2, NON_DEFINI: 1 });
  });
});
