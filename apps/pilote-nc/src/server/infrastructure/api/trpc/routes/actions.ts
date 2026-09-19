import { z } from "zod";
import { créerRouteurTRPC, procédureProtégée } from "../trpc";
import { getContainer } from "@/server/dependances";
import { construireHabilitation } from "@/server/gestion-utilisateur/domain/habilitation/construireHabilitation";
import { NotFoundError } from "@/server/app/error-boundary/not-found-error";
import { TypeAction } from "@/server/actions/domain/TypeAction";

const listerSurchargesDroits = () =>
  getContainer("droits").resolve("droitRepository").listerSurcharges();

export const actionsRouter = créerRouteurTRPC({
  lister: procédureProtégée.query(async ({ ctx }) => {
    const habilitation = construireHabilitation(ctx.session);
    const actions = await getContainer("actions")
      .resolve("listerToutesActionsUseCase")
      .run();
    return actions.filter((action) => habilitation.peutLireMesure(action));
  }),

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

      return getContainer("actions")
        .resolve("listerActionsUseCase")
        .run(input.mesureId);
    }),

  creer: procédureProtégée
    .input(
      z.object({
        mesureId: z.string().uuid(),
        titre: z.string().min(1),
        type: z.nativeEnum(TypeAction),
        dateEcheance: z.coerce.date().nullable(),
        datePrevisionnelleDebut: z.coerce.date().nullable(),
        datePrevisionnelleFin: z.coerce.date().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const mesure = await getContainer("mesures")
        .resolve("recupererUneMesureUseCase")
        .run(input.mesureId);
      if (!mesure) throw new NotFoundError("Mesure introuvable");

      const droits = await listerSurchargesDroits();
      construireHabilitation(ctx.session).verifierAutorisationCreationAction(
        mesure,
        droits,
      );

      return getContainer("actions")
        .resolve("creerActionUseCase")
        .run({ ...input, auteurCreationId: ctx.session.user.id });
    }),

  saisirAvancement: procédureProtégée
    .input(
      z.object({
        id: z.string().uuid(),
        tauxAvancement: z.number().min(0).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const scope = await getContainer("actions")
        .resolve("actionRepository")
        .récupérerScopeParId(input.id);
      if (!scope) throw new NotFoundError("Action introuvable");

      const droits = await listerSurchargesDroits();
      construireHabilitation(
        ctx.session,
      ).verifierAutorisationModificationAction(scope, droits);

      return getContainer("actions")
        .resolve("saisirAvancementActionUseCase")
        .run({ ...input, auteurModificationId: ctx.session.user.id });
    }),

  modifierDatesPrevisionnelles: procédureProtégée
    .input(
      z.object({
        id: z.string().uuid(),
        datePrevisionnelleDebut: z.coerce.date().nullable(),
        datePrevisionnelleFin: z.coerce.date().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const scope = await getContainer("actions")
        .resolve("actionRepository")
        .récupérerScopeParId(input.id);
      if (!scope) throw new NotFoundError("Action introuvable");

      const droits = await listerSurchargesDroits();
      construireHabilitation(
        ctx.session,
      ).verifierAutorisationModificationAction(scope, droits);

      return getContainer("actions")
        .resolve("modifierDatesPrevisionnellesActionUseCase")
        .run({ ...input, auteurModificationId: ctx.session.user.id });
    }),

  definirBlocage: procédureProtégée
    .input(
      z
        .object({
          id: z.string().uuid(),
          bloquee: z.boolean(),
          raisonBlocage: z.string().nullable(),
          precisionArbitrage: z.string().nullable(),
        })
        .refine(
          (donnees) =>
            !donnees.bloquee || (donnees.raisonBlocage?.trim().length ?? 0) > 0,
          {
            message: "La raison du blocage est obligatoire",
            path: ["raisonBlocage"],
          },
        ),
    )
    .mutation(async ({ ctx, input }) => {
      const scope = await getContainer("actions")
        .resolve("actionRepository")
        .récupérerScopeParId(input.id);
      if (!scope) throw new NotFoundError("Action introuvable");

      const droits = await listerSurchargesDroits();
      construireHabilitation(
        ctx.session,
      ).verifierAutorisationModificationAction(scope, droits);

      return getContainer("actions")
        .resolve("definirBlocageActionUseCase")
        .run({ ...input, auteurModificationId: ctx.session.user.id });
    }),

  supprimer: procédureProtégée
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const scope = await getContainer("actions")
        .resolve("actionRepository")
        .récupérerScopeParId(input.id);
      if (!scope) throw new NotFoundError("Action introuvable");

      const droits = await listerSurchargesDroits();
      construireHabilitation(ctx.session).verifierAutorisationSuppressionAction(
        scope,
        droits,
      );

      return getContainer("actions")
        .resolve("supprimerActionUseCase")
        .run({ ...input, auteurModificationId: ctx.session.user.id });
    }),
});
