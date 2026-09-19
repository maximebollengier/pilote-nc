import { describe, expect, it } from "vitest";
import { calculerMeteoAvancement } from "./calculerMeteoAvancement";

describe("calculerMeteoAvancement", () => {
  it("retourne null quand la mesure n'a aucune action", () => {
    expect(calculerMeteoAvancement([])).toBeNull();
  });

  it("retourne le taux de la seule action quand il n'y en a qu'une", () => {
    expect(calculerMeteoAvancement([100])).toEqual(100);
  });

  it("retourne la moyenne arithmétique des taux d'avancement", () => {
    expect(calculerMeteoAvancement([70, 60, 100])).toBeCloseTo(76.67, 1);
  });

  it("retourne 0 quand toutes les actions sont à 0%", () => {
    expect(calculerMeteoAvancement([0, 0])).toEqual(0);
  });
});
