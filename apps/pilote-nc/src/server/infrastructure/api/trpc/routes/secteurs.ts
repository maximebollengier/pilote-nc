import { z } from "zod";
import { créerRouteurTRPC, procédureAvecProfil, procédureProtégée } from "../trpc";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { getContainer } from "@/server/dependances";

export const secteursRouter = créerRouteurTRPC({
  lister: procédureProtégée.query(() => {
    return getContainer("secteurs").resolve("listerSecteursUseCase").run();
  }),

  creer: procédureAvecProfil([ProfilEnum.ADMIN_OUTIL])
    .input(
      z.object({
        code: z.string().min(1),
        nom: z.string().min(1),
        accordGouvernance: z.boolean().default(false),
        membreGouvernementId: z.string().uuid().nullable(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return getContainer("secteurs")
        .resolve("creerSecteurUseCase")
        .run({ ...input, auteurCreationId: ctx.session.user.id });
    }),

  modifier: procédureAvecProfil([ProfilEnum.ADMIN_OUTIL])
    .input(
      z.object({
        id: z.string().uuid(),
        code: z.string().min(1),
        nom: z.string().min(1),
        accordGouvernance: z.boolean(),
        membreGouvernementId: z.string().uuid().nullable(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return getContainer("secteurs")
        .resolve("modifierSecteurUseCase")
        .run({ ...input, auteurModificationId: ctx.session.user.id });
    }),

  supprimer: procédureAvecProfil([ProfilEnum.ADMIN_OUTIL])
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) => {
      return getContainer("secteurs")
        .resolve("supprimerSecteurUseCase")
        .run({ ...input, auteurModificationId: ctx.session.user.id });
    }),
});
