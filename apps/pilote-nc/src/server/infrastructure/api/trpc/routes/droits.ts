import { z } from "zod";
import { créerRouteurTRPC, procédureAvecProfil } from "../trpc";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { ActionDroit } from "@/server/droits/domain/ActionDroit";
import { getContainer } from "@/server/dependances";

export const droitsRouter = créerRouteurTRPC({
  lister: procédureAvecProfil([ProfilEnum.ADMIN_OUTIL]).query(() => {
    return getContainer("droits").resolve("listerDroitsUseCase").run();
  }),

  definir: procédureAvecProfil([ProfilEnum.ADMIN_OUTIL])
    .input(
      z.object({
        action: z.nativeEnum(ActionDroit),
        profil: z.nativeEnum(ProfilEnum),
        autorise: z.boolean(),
      }),
    )
    .mutation(({ input }) => {
      return getContainer("droits").resolve("definirDroitUseCase").run(input);
    }),
});
