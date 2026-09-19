import {
  defineModule,
  type ExtractScope,
  type VerifyCradle,
} from "@/server/module-system";
import PrismaJournalRepository from "@/server/journal/infrastructure/PrismaJournalRepository";
import JournalRepository from "@/server/journal/domain/ports/JournalRepository";
import ListerJournalUseCase from "@/server/journal/usecases/ListerJournalUseCase";

type JournalExports = {
  journalRepository: JournalRepository;
  listerJournalUseCase: ListerJournalUseCase;
};

export const journalModule = defineModule<JournalExports, JournalExports>()({
  name: "journal",
  imports: ["shared"],
  exports: ["journalRepository", "listerJournalUseCase"],
  register: (container, { asModuleClass }) => {
    container.register({
      journalRepository: asModuleClass(PrismaJournalRepository),
      listerJournalUseCase: asModuleClass(ListerJournalUseCase),
    } satisfies VerifyCradle<JournalExports>);
  },
});

export type Inject<K extends keyof ExtractScope<typeof journalModule>> = Pick<
  ExtractScope<typeof journalModule>,
  K
>;
