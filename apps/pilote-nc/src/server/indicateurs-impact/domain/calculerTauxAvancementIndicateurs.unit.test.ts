import { describe, expect, it } from "vitest";
import { calculerTauxAvancementIndicateurs } from "./calculerTauxAvancementIndicateurs";

describe("calculerTauxAvancementIndicateurs", () => {
  it("retourne null quand la mesure n'a aucun indicateur", () => {
    expect(calculerTauxAvancementIndicateurs([])).toBeNull();
  });

  it("retourne null quand aucun indicateur n'a de taux calculable", () => {
    expect(calculerTauxAvancementIndicateurs([null, null])).toBeNull();
  });

  it("ignore les indicateurs sans taux calculable dans la moyenne", () => {
    expect(calculerTauxAvancementIndicateurs([80, null, 40])).toEqual(60);
  });

  it("retourne la moyenne arithmétique des taux de réalisation", () => {
    expect(calculerTauxAvancementIndicateurs([70, 60, 100])).toBeCloseTo(
      76.67,
      1,
    );
  });
});
