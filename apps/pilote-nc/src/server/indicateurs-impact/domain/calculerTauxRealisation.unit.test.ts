import { describe, expect, it } from "vitest";
import {
  calculerTauxRealisation,
  valeurCibleEstCoherenteAvecSensEvolution,
} from "./calculerTauxRealisation";

describe("calculerTauxRealisation", () => {
  it("retourne null tant qu'aucune valeur actuelle n'est connue", () => {
    expect(
      calculerTauxRealisation({
        valeurInitiale: 0,
        valeurCible: 20,
        valeurActuelle: null,
        sensEvolution: "A_LA_HAUSSE",
      }),
    ).toBeNull();
  });

  it("calcule le taux pour un indicateur à la hausse", () => {
    expect(
      calculerTauxRealisation({
        valeurInitiale: 0,
        valeurCible: 20,
        valeurActuelle: 5,
        sensEvolution: "A_LA_HAUSSE",
      }),
    ).toEqual(25);
  });

  it("calcule le taux pour un indicateur à la baisse", () => {
    // Ex. taux de chômage : initial 20%, cible 10%, actuel 15% -> à mi-chemin
    expect(
      calculerTauxRealisation({
        valeurInitiale: 20,
        valeurCible: 10,
        valeurActuelle: 15,
        sensEvolution: "A_LA_BAISSE",
      }),
    ).toEqual(50);
  });

  it("dépasse 100% en cas de sur-performance (à la hausse), sans être plafonné", () => {
    expect(
      calculerTauxRealisation({
        valeurInitiale: 0,
        valeurCible: 20,
        valeurActuelle: 25,
        sensEvolution: "A_LA_HAUSSE",
      }),
    ).toEqual(125);
  });

  it("dépasse 100% en cas de sur-performance (à la baisse)", () => {
    expect(
      calculerTauxRealisation({
        valeurInitiale: 20,
        valeurCible: 10,
        valeurActuelle: 5,
        sensEvolution: "A_LA_BAISSE",
      }),
    ).toEqual(150);
  });

  it("retourne null si la cible est égale à la valeur initiale (dénominateur nul)", () => {
    expect(
      calculerTauxRealisation({
        valeurInitiale: 10,
        valeurCible: 10,
        valeurActuelle: 10,
        sensEvolution: "A_LA_HAUSSE",
      }),
    ).toBeNull();
  });
});

describe("valeurCibleEstCoherenteAvecSensEvolution", () => {
  it("exige une cible supérieure à l'initiale quand le sens est à la hausse", () => {
    expect(
      valeurCibleEstCoherenteAvecSensEvolution({
        valeurInitiale: 0,
        valeurCible: 20,
        sensEvolution: "A_LA_HAUSSE",
      }),
    ).toBe(true);
    expect(
      valeurCibleEstCoherenteAvecSensEvolution({
        valeurInitiale: 20,
        valeurCible: 0,
        sensEvolution: "A_LA_HAUSSE",
      }),
    ).toBe(false);
  });

  it("exige une cible inférieure à l'initiale quand le sens est à la baisse", () => {
    expect(
      valeurCibleEstCoherenteAvecSensEvolution({
        valeurInitiale: 20,
        valeurCible: 10,
        sensEvolution: "A_LA_BAISSE",
      }),
    ).toBe(true);
    expect(
      valeurCibleEstCoherenteAvecSensEvolution({
        valeurInitiale: 10,
        valeurCible: 20,
        sensEvolution: "A_LA_BAISSE",
      }),
    ).toBe(false);
  });
});
