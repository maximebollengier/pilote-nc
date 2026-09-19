import { z } from "zod";
import { créerRouteurTRPC, procédureAvecDroit, procédureProtégée } from "../trpc";
import { getContainer } from "@/server/dependances";
import { construireHabilitation } from "@/server/gestion-utilisateur/domain/habilitation/construireHabilitation";
import { NotFoundError } from "@/server/app/error-boundary/not-found-error";
import { StatutMesure } from "@/server/mesures/domain/StatutMesure";
import { MesurePrioritaire } from "@/server/mesures/domain/MesurePrioritaire";
import { PhaseMesure } from "@/server/mesures/domain/PhaseMesure";

export const mesuresRouter = créerRouteurTRPC({
  lister: procédureProtégée.query(async ({ ctx }) => {
    const habilitation = construireHabilitation(ctx.session);
    const mesures = await getContainer("mesures")
      .resolve("listerMesuresUseCase")
      .run();
    return mesures.filter((mesure) => habilitation.peutLireMesure(mesure));
  }),

  recuperer: procédureProtégée
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const mesure = await getContainer("mesures")
        .resolve("recupererUneMesureUseCase")
        .run(input.id);
      if (!mesure) throw new NotFoundError("Mesure introuvable");

      construireHabilitation(ctx.session).verifierAutorisationLectureMesure(
        mesure,
      );
      return mesure;
    }),

  creer: procédureAvecDroit("MESURE_CREER")
    .input(
      z.object({
        code: z.string().min(1),
        titre: z.string().min(1),
        description: z.string().nullable(),
        secteurId: z.string().uuid(),
        coPorteurIds: z.array(z.string().uuid()).default([]),
        mesurePrioritaire: z.nativeEnum(MesurePrioritaire),
        phase: z.nativeEnum(PhaseMesure).default(PhaseMesure.AN_1),
      }).refine((donnees) => !donnees.coPorteurIds.includes(donnees.secteurId), {
        message: "Le porteur ne peut pas être également co-porteur",
        path: ["coPorteurIds"],
      }),
    )
    .mutation(({ ctx, input }) => {
      return getContainer("mesures")
        .resolve("creerMesureUseCase")
        .run({ ...input, auteurCreationId: ctx.session.user.id });
    }),

  modifier: procédureAvecDroit("MESURE_MODIFIER")
    .input(
      z.object({
        id: z.string().uuid(),
        code: z.string().min(1),
        titre: z.string().min(1),
        secteurId: z.string().uuid(),
        coPorteurIds: z.array(z.string().uuid()).default([]),
        mesurePrioritaire: z.nativeEnum(MesurePrioritaire),
      }).refine((donnees) => !donnees.coPorteurIds.includes(donnees.secteurId), {
        message: "Le porteur ne peut pas être également co-porteur",
        path: ["coPorteurIds"],
      }),
    )
    .mutation(({ ctx, input }) => {
      return getContainer("mesures")
        .resolve("modifierMesureUseCase")
        .run({ ...input, auteurModificationId: ctx.session.user.id });
    }),

  modifierStatut: procédureAvecDroit("MESURE_MODIFIER_STATUT")
    .input(
      z.object({
        id: z.string().uuid(),
        statut: z.nativeEnum(StatutMesure),
      }),
    )
    .mutation(({ ctx, input }) => {
      return getContainer("mesures")
        .resolve("modifierStatutMesureUseCase")
        .run({ ...input, auteurModificationId: ctx.session.user.id });
    }),

  modifierPhase: procédureAvecDroit("MESURE_MODIFIER_PHASE")
    .input(
      z.object({
        id: z.string().uuid(),
        phase: z.nativeEnum(PhaseMesure),
      }),
    )
    .mutation(({ ctx, input }) => {
      return getContainer("mesures")
        .resolve("modifierPhaseMesureUseCase")
        .run({ ...input, auteurModificationId: ctx.session.user.id });
    }),
});
