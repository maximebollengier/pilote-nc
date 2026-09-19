import { z } from "zod";
import { créerRouteurTRPC, procédureAvecDroit, procédureProtégée } from "../trpc";
import { getContainer } from "@/server/dependances";
import { construireHabilitation } from "@/server/gestion-utilisateur/domain/habilitation/construireHabilitation";
import { NotFoundError } from "@/server/app/error-boundary/not-found-error";
import { SensEvolution } from "@/server/indicateurs-impact/domain/SensEvolution";

export const indicateursImpactRouter = créerRouteurTRPC({
  listerParMesure: procédureProtégée
    .input(z.object({ mesureId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const mesure = await getContainer("mesures")
        .resolve("recupererUneMesureUseCase")
        .run(input.mesureId);
      if (!mesure) throw new NotFoundError("Mesure introuvable");

      construireHabilitation(ctx.session).verifierAutorisationLectureMesure(
        mesure,
      );

      return getContainer("indicateursImpact")
        .resolve("listerIndicateursImpactUseCase")
        .run(input.mesureId);
    }),

  creer: procédureAvecDroit("INDICATEUR_CREER")
    .input(
      z.object({
        mesureId: z.string().uuid(),
        nom: z.string().min(1),
        unite: z.string().nullable(),
        sensEvolution: z.nativeEnum(SensEvolution),
        valeurInitiale: z.number(),
        valeurCible: z.number(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return getContainer("indicateursImpact")
        .resolve("creerIndicateurImpactUseCase")
        .run({ ...input, auteurCreationId: ctx.session.user.id });
    }),
});
