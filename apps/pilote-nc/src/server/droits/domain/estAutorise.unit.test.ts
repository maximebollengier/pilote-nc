import { describe, expect, it } from "vitest";
import { estAutorise } from "./estAutorise";
import Droit from "./Droit.interface";

describe("estAutorise", () => {
  it("retombe sur la valeur par défaut quand aucune surcharge n'existe", () => {
    expect(estAutorise([], "MESURE_CREER", "ADMIN_OUTIL")).toBe(true);
    expect(estAutorise([], "MESURE_CREER", "DIRECTION_NC")).toBe(false);
    expect(estAutorise([], "INDICATEUR_CREER", "PRESIDENT")).toBe(false);
  });

  it("une surcharge à true remplace un défaut à false", () => {
    const surcharges: Droit[] = [
      { action: "INDICATEUR_CREER", profil: "PRESIDENT", autorise: true },
    ];
    expect(estAutorise(surcharges, "INDICATEUR_CREER", "PRESIDENT")).toBe(true);
  });

  it("une surcharge à false remplace un défaut à true", () => {
    const surcharges: Droit[] = [
      { action: "MESURE_CREER", profil: "ADMIN_OUTIL", autorise: false },
    ];
    expect(estAutorise(surcharges, "MESURE_CREER", "ADMIN_OUTIL")).toBe(false);
  });

  it("une surcharge ne s'applique qu'à sa propre combinaison (action, profil)", () => {
    const surcharges: Droit[] = [
      { action: "MESURE_CREER", profil: "ADMIN_OUTIL", autorise: false },
    ];
    expect(estAutorise(surcharges, "MESURE_MODIFIER", "ADMIN_OUTIL")).toBe(true);
    expect(estAutorise(surcharges, "MESURE_CREER", "PRESIDENT")).toBe(true);
  });
});
