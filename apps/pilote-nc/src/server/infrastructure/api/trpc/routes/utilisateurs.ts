import { z } from "zod";
import { créerRouteurTRPC, procédureAvecProfil } from "../trpc";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { getContainer } from "@/server/dependances";

// NON_DEFINI n'est jamais un choix : c'est l'état posé automatiquement à la
// première connexion (cf. session() dans [...nextauth].tsx), pas un profil
// qu'un ADMIN_OUTIL attribue à la création ou à la modification.
const profilAssignable = z
  .nativeEnum(ProfilEnum)
  .refine((profil) => profil !== ProfilEnum.NON_DEFINI, {
    message: "Choisissez un profil",
  });

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
        profil: profilAssignable,
        transparenceGlobale: z.boolean().default(false),
      }),
    )
    .mutation(({ input }) => {
      return getContainer("gestionUtilisateur")
        .resolve("creerUtilisateurUseCase")
        .run(input);
    }),

  modifier: procédureAvecProfil([ProfilEnum.ADMIN_OUTIL])
    .input(
      z.object({
        id: z.string().uuid(),
        nom: z.string().min(1),
        prenom: z.string().min(1),
        profil: profilAssignable,
        transparenceGlobale: z.boolean().default(false),
      }),
    )
    .mutation(({ input }) => {
      return getContainer("gestionUtilisateur")
        .resolve("modifierUtilisateurUseCase")
        .run(input);
    }),
});
