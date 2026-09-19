import { describe, expect, it } from "vitest";
import Habilitation from "./Habilitation";
import { UnauthorizedError } from "@/server/app/error-boundary/unauthorized-error";

const SECTEUR_A = "secteur-a";
const SECTEUR_B = "secteur-b";

describe("Habilitation", () => {
  describe("verifierAutorisationCreationSecteur / Direction / Mesure / Indicateur / Utilisateur", () => {
    it("autorise ADMIN_OUTIL", () => {
      const habilitation = new Habilitation({
        profil: "ADMIN_OUTIL",
        habilitationsSecteur: [],
        transparenceGlobale: false,
      });
      expect(() => habilitation.verifierAutorisationCreationSecteur()).not.toThrow();
      expect(() => habilitation.verifierAutorisationCreationMesure()).not.toThrow();
      expect(() => habilitation.verifierAutorisationCreationIndicateur()).not.toThrow();
      expect(() => habilitation.verifierAutorisationCreationUtilisateur()).not.toThrow();
    });

    it.each(["PRESIDENT", "MEMBRE_GOUVERNEMENT", "SECRETARIAT_GENERAL", "DIRECTION_NC"] as const)(
      "refuse %s",
      (profil) => {
        const habilitation = new Habilitation({
          profil,
          habilitationsSecteur: [],
          transparenceGlobale: false,
        });
        expect(() => habilitation.verifierAutorisationCreationSecteur()).toThrow(
          UnauthorizedError,
        );
      },
    );
  });

  describe("verifierAutorisationCreationAction", () => {
    it.each(["ADMIN_OUTIL", "SECRETARIAT_GENERAL"] as const)(
      "autorise %s sur n'importe quel secteur, sans habilitation (valeurs par défaut)",
      (profil) => {
        const habilitation = new Habilitation({
          profil,
          habilitationsSecteur: [],
          transparenceGlobale: false,
        });
        expect(() =>
          habilitation.verifierAutorisationCreationAction(
            { secteurId: SECTEUR_A },
            [],
          ),
        ).not.toThrow();
      },
    );

    it("autorise DIRECTION_NC sur une mesure de son propre secteur, sans validation d'un autre profil (valeurs par défaut)", () => {
      const habilitation = new Habilitation({
        profil: "DIRECTION_NC",
        habilitationsSecteur: [SECTEUR_A],
        transparenceGlobale: false,
      });
      expect(() =>
        habilitation.verifierAutorisationCreationAction(
          { secteurId: SECTEUR_A },
          [],
        ),
      ).not.toThrow();
    });

    it("refuse DIRECTION_NC sur une mesure d'un secteur qui ne lui est pas habilité, même autorisé par la matrice", () => {
      const habilitation = new Habilitation({
        profil: "DIRECTION_NC",
        habilitationsSecteur: [SECTEUR_B],
        transparenceGlobale: false,
      });
      expect(() =>
        habilitation.verifierAutorisationCreationAction(
          { secteurId: SECTEUR_A },
          [],
        ),
      ).toThrow(UnauthorizedError);
    });

    it.each(["PRESIDENT", "MEMBRE_GOUVERNEMENT"] as const)(
      "refuse %s même sur un secteur habilité (valeurs par défaut)",
      (profil) => {
        const habilitation = new Habilitation({
          profil,
          habilitationsSecteur: [SECTEUR_A],
          transparenceGlobale: false,
        });
        expect(() =>
          habilitation.verifierAutorisationCreationAction(
            { secteurId: SECTEUR_A },
            [],
          ),
        ).toThrow(UnauthorizedError);
      },
    );

    it("autorise PRESIDENT quand une surcharge de la matrice de droits l'autorise explicitement", () => {
      const habilitation = new Habilitation({
        profil: "PRESIDENT",
        habilitationsSecteur: [],
        transparenceGlobale: false,
      });
      expect(() =>
        habilitation.verifierAutorisationCreationAction({ secteurId: SECTEUR_A }, [
          { action: "ACTION_CREER", profil: "PRESIDENT", autorise: true },
        ]),
      ).not.toThrow();
    });

    it("refuse ADMIN_OUTIL quand une surcharge de la matrice de droits le désactive explicitement", () => {
      const habilitation = new Habilitation({
        profil: "ADMIN_OUTIL",
        habilitationsSecteur: [],
        transparenceGlobale: false,
      });
      expect(() =>
        habilitation.verifierAutorisationCreationAction({ secteurId: SECTEUR_A }, [
          { action: "ACTION_CREER", profil: "ADMIN_OUTIL", autorise: false },
        ]),
      ).toThrow(UnauthorizedError);
    });
  });

  describe("verifierAutorisationModificationAction", () => {
    it.each(["ADMIN_OUTIL", "SECRETARIAT_GENERAL"] as const)(
      "autorise %s sur n'importe quel secteur, sans habilitation (valeurs par défaut)",
      (profil) => {
        const habilitation = new Habilitation({
          profil,
          habilitationsSecteur: [],
          transparenceGlobale: false,
        });
        expect(() =>
          habilitation.verifierAutorisationModificationAction(
            { secteurId: SECTEUR_A },
            [],
          ),
        ).not.toThrow();
      },
    );

    it("autorise DIRECTION_NC habilité sur le secteur de la mesure (valeurs par défaut)", () => {
      const habilitation = new Habilitation({
        profil: "DIRECTION_NC",
        habilitationsSecteur: [SECTEUR_A],
        transparenceGlobale: false,
      });
      expect(() =>
        habilitation.verifierAutorisationModificationAction(
          { secteurId: SECTEUR_A },
          [],
        ),
      ).not.toThrow();
    });

    it("refuse DIRECTION_NC non habilité sur ce secteur", () => {
      const habilitation = new Habilitation({
        profil: "DIRECTION_NC",
        habilitationsSecteur: [SECTEUR_B],
        transparenceGlobale: false,
      });
      expect(() =>
        habilitation.verifierAutorisationModificationAction(
          { secteurId: SECTEUR_A },
          [],
        ),
      ).toThrow(UnauthorizedError);
    });

    it("refuse un autre profil même habilité sur le secteur (valeurs par défaut)", () => {
      const habilitation = new Habilitation({
        profil: "MEMBRE_GOUVERNEMENT",
        habilitationsSecteur: [SECTEUR_A],
        transparenceGlobale: false,
      });
      expect(() =>
        habilitation.verifierAutorisationModificationAction(
          { secteurId: SECTEUR_A },
          [],
        ),
      ).toThrow(UnauthorizedError);
    });
  });

  describe("verifierAutorisationDecisionPva", () => {
    it("autorise uniquement SECRETARIAT_GENERAL, sans notion de secteur", () => {
      expect(() =>
        new Habilitation({
          profil: "SECRETARIAT_GENERAL",
          habilitationsSecteur: [],
          transparenceGlobale: false,
        }).verifierAutorisationDecisionPva(),
      ).not.toThrow();

      expect(() =>
        new Habilitation({
          profil: "ADMIN_OUTIL",
          habilitationsSecteur: [],
          transparenceGlobale: false,
        }).verifierAutorisationDecisionPva(),
      ).toThrow(UnauthorizedError);
    });
  });

  describe("peutLireMesure / verifierAutorisationLectureMesure", () => {
    it("PRESIDENT, SECRETARIAT_GENERAL et ADMIN_OUTIL lisent tout, sans habilitation", () => {
      for (const profil of ["PRESIDENT", "SECRETARIAT_GENERAL", "ADMIN_OUTIL"] as const) {
        const habilitation = new Habilitation({
          profil,
          habilitationsSecteur: [],
          transparenceGlobale: false,
        });
        expect(habilitation.peutLireMesure({ secteurId: SECTEUR_A })).toBe(true);
      }
    });

    it("MEMBRE_GOUVERNEMENT sans transparenceGlobale est restreint à ses secteurs", () => {
      const habilitation = new Habilitation({
        profil: "MEMBRE_GOUVERNEMENT",
        habilitationsSecteur: [SECTEUR_A],
        transparenceGlobale: false,
      });
      expect(habilitation.peutLireMesure({ secteurId: SECTEUR_A })).toBe(true);
      expect(habilitation.peutLireMesure({ secteurId: SECTEUR_B })).toBe(false);
    });

    it("MEMBRE_GOUVERNEMENT avec transparenceGlobale voit tous les secteurs", () => {
      const habilitation = new Habilitation({
        profil: "MEMBRE_GOUVERNEMENT",
        habilitationsSecteur: [],
        transparenceGlobale: true,
      });
      expect(habilitation.peutLireMesure({ secteurId: SECTEUR_B })).toBe(true);
    });

    it("DIRECTION_NC est restreint à ses secteurs habilités", () => {
      const habilitation = new Habilitation({
        profil: "DIRECTION_NC",
        habilitationsSecteur: [SECTEUR_A],
        transparenceGlobale: false,
      });
      expect(habilitation.peutLireMesure({ secteurId: SECTEUR_A })).toBe(true);
      expect(habilitation.peutLireMesure({ secteurId: SECTEUR_B })).toBe(false);
    });

    it("verifierAutorisationLectureMesure lève UnauthorizedError quand peutLireMesure est faux", () => {
      const habilitation = new Habilitation({
        profil: "DIRECTION_NC",
        habilitationsSecteur: [SECTEUR_B],
        transparenceGlobale: false,
      });
      expect(() =>
        habilitation.verifierAutorisationLectureMesure({ secteurId: SECTEUR_A }),
      ).toThrow(UnauthorizedError);
    });
  });
});
