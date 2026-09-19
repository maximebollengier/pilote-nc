import { créerRouteurTRPC, procédureAvecProfil } from "../trpc";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { getContainer } from "@/server/dependances";

export const journalRouter = créerRouteurTRPC({
  lister: procédureAvecProfil([ProfilEnum.ADMIN_OUTIL]).query(() => {
    return getContainer("journal").resolve("listerJournalUseCase").run();
  }),
});
