import {
  defineModule,
  type ExtractScope,
  type VerifyCradle,
} from "@/server/module-system";
import PrismaMesureRepository from "@/server/mesures/infrastructure/PrismaMesureRepository";
import MesureRepository from "@/server/mesures/domain/ports/MesureRepository";
import CreerMesureUseCase from "@/server/mesures/usecases/CreerMesureUseCase";
import ListerMesuresUseCase from "@/server/mesures/usecases/ListerMesuresUseCase";
import RecupererUneMesureUseCase from "@/server/mesures/usecases/RecupererUneMesureUseCase";
import ModifierMesureUseCase from "@/server/mesures/usecases/ModifierMesureUseCase";
import ModifierStatutMesureUseCase from "@/server/mesures/usecases/ModifierStatutMesureUseCase";
import ModifierPhaseMesureUseCase from "@/server/mesures/usecases/ModifierPhaseMesureUseCase";
import RecalculerMeteoMesureUseCase from "@/server/mesures/usecases/RecalculerMeteoMesureUseCase";

type MesuresExports = {
  mesureRepository: MesureRepository;
  creerMesureUseCase: CreerMesureUseCase;
  listerMesuresUseCase: ListerMesuresUseCase;
  recupererUneMesureUseCase: RecupererUneMesureUseCase;
  modifierMesureUseCase: ModifierMesureUseCase;
  modifierStatutMesureUseCase: ModifierStatutMesureUseCase;
  modifierPhaseMesureUseCase: ModifierPhaseMesureUseCase;
  recalculerMeteoMesureUseCase: RecalculerMeteoMesureUseCase;
};

type MesuresCradle = MesuresExports;

export const mesuresModule = defineModule<MesuresExports, MesuresCradle>()({
  name: "mesures",
  imports: ["shared"],
  exports: [
    "mesureRepository",
    "creerMesureUseCase",
    "listerMesuresUseCase",
    "recupererUneMesureUseCase",
    "modifierMesureUseCase",
    "modifierStatutMesureUseCase",
    "modifierPhaseMesureUseCase",
    "recalculerMeteoMesureUseCase",
  ],
  register: (container, { asModuleClass }) => {
    container.register({
      mesureRepository: asModuleClass(PrismaMesureRepository),
      creerMesureUseCase: asModuleClass(CreerMesureUseCase),
      listerMesuresUseCase: asModuleClass(ListerMesuresUseCase),
      recupererUneMesureUseCase: asModuleClass(RecupererUneMesureUseCase),
      modifierMesureUseCase: asModuleClass(ModifierMesureUseCase),
      modifierStatutMesureUseCase: asModuleClass(ModifierStatutMesureUseCase),
      modifierPhaseMesureUseCase: asModuleClass(ModifierPhaseMesureUseCase),
      recalculerMeteoMesureUseCase: asModuleClass(
        RecalculerMeteoMesureUseCase,
      ),
    } satisfies VerifyCradle<MesuresCradle>);
  },
});

export type Inject<K extends keyof ExtractScope<typeof mesuresModule>> = Pick<
  ExtractScope<typeof mesuresModule>,
  K
>;
