import {
  defineModule,
  type ExtractScope,
  type VerifyCradle,
} from "@/server/module-system";
import PrismaDroitRepository from "@/server/droits/infrastructure/PrismaDroitRepository";
import DroitRepository from "@/server/droits/domain/ports/DroitRepository";
import ListerDroitsUseCase from "@/server/droits/usecases/ListerDroitsUseCase";
import DefinirDroitUseCase from "@/server/droits/usecases/DefinirDroitUseCase";

type DroitsExports = {
  droitRepository: DroitRepository;
  listerDroitsUseCase: ListerDroitsUseCase;
  definirDroitUseCase: DefinirDroitUseCase;
};

type DroitsCradle = DroitsExports;

export const droitsModule = defineModule<DroitsExports, DroitsCradle>()({
  name: "droits",
  imports: ["shared"],
  exports: ["droitRepository", "listerDroitsUseCase", "definirDroitUseCase"],
  register: (container, { asModuleClass }) => {
    container.register({
      droitRepository: asModuleClass(PrismaDroitRepository),
      listerDroitsUseCase: asModuleClass(ListerDroitsUseCase),
      definirDroitUseCase: asModuleClass(DefinirDroitUseCase),
    } satisfies VerifyCradle<DroitsCradle>);
  },
});

export type Inject<K extends keyof ExtractScope<typeof droitsModule>> = Pick<
  ExtractScope<typeof droitsModule>,
  K
>;
