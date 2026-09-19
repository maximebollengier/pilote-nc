import { z } from "zod";
import { créerRouteurTRPC, procédureAvecProfil, procédureProtégée } from "../trpc";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { getContainer } from "@/server/dependances";

export const directionsRouter = créerRouteurTRPC({
  lister: procédureProtégée.query(() => {
    return getContainer("directions").resolve("listerDirectionsUseCase").run();
  }),

  creer: procédureAvecProfil([ProfilEnum.ADMIN_OUTIL])
    .input(
      z.object({
        code: z.string().min(1),
        nom: z.string().min(1),
        secteurIds: z.array(z.string().uuid()).min(1),
      }),
    )
    .mutation(({ ctx, input }) => {
      return getContainer("directions")
        .resolve("creerDirectionUseCase")
        .run({ ...input, auteurCreationId: ctx.session.user.id });
    }),

  modifier: procédureAvecProfil([ProfilEnum.ADMIN_OUTIL])
    .input(
      z.object({
        id: z.string().uuid(),
        code: z.string().min(1),
        nom: z.string().min(1),
        secteurIds: z.array(z.string().uuid()).min(1),
      }),
    )
    .mutation(({ ctx, input }) => {
      return getContainer("directions")
        .resolve("modifierDirectionUseCase")
        .run({ ...input, auteurModificationId: ctx.session.user.id });
    }),

  supprimer: procédureAvecProfil([ProfilEnum.ADMIN_OUTIL])
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) => {
      return getContainer("directions")
        .resolve("supprimerDirectionUseCase")
        .run({ ...input, auteurModificationId: ctx.session.user.id });
    }),
});
