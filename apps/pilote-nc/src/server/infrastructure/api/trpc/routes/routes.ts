import { créerRouteurTRPC } from "../trpc";
import { profilUtilisateurRouter } from "./profilUtilisateur";
import { utilisateursRouter } from "./utilisateurs";
import { secteursRouter } from "./secteurs";
import { directionsRouter } from "./directions";
import { mesuresRouter } from "./mesures";
import { actionsRouter } from "./actions";
import { indicateursImpactRouter } from "./indicateursImpact";
import { propositionValeurAvancementRouter } from "./propositionValeurAvancement";
import { journalRouter } from "./journal";
import { droitsRouter } from "./droits";

export const appRouter = créerRouteurTRPC({
  profilUtilisateur: profilUtilisateurRouter,
  utilisateurs: utilisateursRouter,
  secteurs: secteursRouter,
  directions: directionsRouter,
  mesures: mesuresRouter,
  actions: actionsRouter,
  indicateursImpact: indicateursImpactRouter,
  propositionValeurAvancement: propositionValeurAvancementRouter,
  journal: journalRouter,
  droits: droitsRouter,
});

export type AppRouter = typeof appRouter;
