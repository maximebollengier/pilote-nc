import { z } from "zod";
import { créerRouteurTRPC, procédureAvecProfil } from "../trpc";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { getContainer } from "@/server/dependances";

export const utilisateursRouter = créerRouteurTRPC({
  lister: procédureAvecProfil([ProfilEnum.ADMIN_OUTIL]).query(() => {
    return getContainer("gestionUtilisateur")
      .resolve("listerUtilisateursUseCase")
      .run();
  }),

  modifierHabilitationsSecteur: procédureAvecProfil([ProfilEnum.ADMIN_OUTIL])
    .input(
      z.object({
        utilisateurId: z.string().uuid(),
        secteurIds: z.array(z.string().uuid()),
      }),
    )
    .mutation(({ input }) => {
      return getContainer("gestionUtilisateur")
        .resolve("modifierHabilitationsSecteurUseCase")
        .run(input);
    }),

  creer: procédureAvecProfil([ProfilEnum.ADMIN_OUTIL])
    .input(
      z.object({
        email: z.string().email(),
        nom: z.string().min(1),
        prenom: z.string().min(1),
        profil: z.nativeEnum(ProfilEnum),
        transparenceGlobale: z.boolean().default(false),
      }),
    )
    .mutation(({ input }) => {
      return getContainer("gestionUtilisateur")
        .resolve("creerUtilisateurUseCase")
        .run(input);
    }),
});
