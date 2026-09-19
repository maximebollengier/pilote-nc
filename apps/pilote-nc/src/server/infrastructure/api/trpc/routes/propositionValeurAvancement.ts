import { z } from "zod";
import { créerRouteurTRPC, procédureAvecProfil, procédureProtégée } from "../trpc";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { getContainer } from "@/server/dependances";
import { construireHabilitation } from "@/server/gestion-utilisateur/domain/habilitation/construireHabilitation";
import { NotFoundError } from "@/server/app/error-boundary/not-found-error";

export const propositionValeurAvancementRouter = créerRouteurTRPC({
  soumettre: procédureProtégée
    .input(
      z.object({
        indicateurId: z.string().uuid(),
        annee: z.number().int().min(2000).max(2100),
        trimestre: z.number().int().min(1).max(4),
        valeurProposee: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const scope = await getContainer("indicateursImpact")
        .resolve("indicateurImpactRepository")
        .récupérerScopeParId(input.indicateurId);
      if (!scope) throw new NotFoundError("Indicateur introuvable");

      construireHabilitation(ctx.session).verifierAutorisationSoumissionPva(
        scope,
      );

      return getContainer("propositionValeurAvancement")
        .resolve("soumettrePvaUseCase")
        .run({ ...input, soumisParId: ctx.session.user.id });
    }),

  listerEnAttente: procédureAvecProfil([ProfilEnum.SECRETARIAT_GENERAL]).query(
    () => {
      return getContainer("propositionValeurAvancement")
        .resolve("listerPvaEnAttenteUseCase")
        .run();
    },
  ),

  valider: procédureAvecProfil([ProfilEnum.SECRETARIAT_GENERAL])
    .input(
      z.object({
        pvaId: z.string().uuid(),
        commentaireSg: z.string().nullable(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return getContainer("propositionValeurAvancement")
        .resolve("validerPvaUseCase")
        .run({ ...input, traiteParId: ctx.session.user.id });
    }),

  validerAvecModification: procédureAvecProfil([ProfilEnum.SECRETARIAT_GENERAL])
    .input(
      z.object({
        pvaId: z.string().uuid(),
        valeurCorrigee: z.number(),
        commentaireSg: z.string().nullable(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return getContainer("propositionValeurAvancement")
        .resolve("validerAvecModificationPvaUseCase")
        .run({ ...input, traiteParId: ctx.session.user.id });
    }),

  refuser: procédureAvecProfil([ProfilEnum.SECRETARIAT_GENERAL])
    .input(
      z.object({
        pvaId: z.string().uuid(),
        // Obligatoire côté spec : contrairement à la validation, un refus
        // exige toujours un motif (validé aussi côté usecase, cf.
        // RefuserPvaUseCase).
        motifRefus: z.string().min(1, "Le motif de refus est obligatoire"),
      }),
    )
    .mutation(({ ctx, input }) => {
      return getContainer("propositionValeurAvancement")
        .resolve("refuserPvaUseCase")
        .run({ ...input, traiteParId: ctx.session.user.id });
    }),

  recupererHistorique: procédureProtégée
    .input(z.object({ pvaId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { pva, evenements } = await getContainer(
        "propositionValeurAvancement",
      )
        .resolve("recupererHistoriquePvaUseCase")
        .run(input.pvaId);

      const scope = await getContainer("indicateursImpact")
        .resolve("indicateurImpactRepository")
        .récupérerScopeParId(pva.indicateurId);
      if (scope) {
        construireHabilitation(ctx.session).verifierAutorisationLectureMesure({
          secteurId: scope.secteurId,
        });
      }

      return { pva, evenements };
    }),

  modifierValeurValidee: procédureAvecProfil([ProfilEnum.SECRETARIAT_GENERAL])
    .input(
      z.object({
        pvaId: z.string().uuid(),
        valeurValidee: z.number(),
        commentaireSg: z.string().nullable(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return getContainer("propositionValeurAvancement")
        .resolve("modifierValeurValideePvaUseCase")
        .run({ ...input, traiteParId: ctx.session.user.id });
    }),

  listerHistoriqueParIndicateur: procédureProtégée
    .input(z.object({ indicateurId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const scope = await getContainer("indicateursImpact")
        .resolve("indicateurImpactRepository")
        .récupérerScopeParId(input.indicateurId);
      if (!scope) throw new NotFoundError("Indicateur introuvable");

      construireHabilitation(ctx.session).verifierAutorisationLectureMesure({
        secteurId: scope.secteurId,
      });

      return getContainer("propositionValeurAvancement")
        .resolve("listerHistoriqueValeursIndicateurUseCase")
        .run(input.indicateurId);
    }),
});
