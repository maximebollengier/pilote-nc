import {
  defineModule,
  type ExtractScope,
  type VerifyCradle,
} from "@/server/module-system";
import PrismaIndicateurImpactRepository from "@/server/indicateurs-impact/infrastructure/PrismaIndicateurImpactRepository";
import IndicateurImpactRepository from "@/server/indicateurs-impact/domain/ports/IndicateurImpactRepository";
import CreerIndicateurImpactUseCase from "@/server/indicateurs-impact/usecases/CreerIndicateurImpactUseCase";
import ListerIndicateursImpactUseCase from "@/server/indicateurs-impact/usecases/ListerIndicateursImpactUseCase";

type IndicateursImpactExports = {
  indicateurImpactRepository: IndicateurImpactRepository;
  creerIndicateurImpactUseCase: CreerIndicateurImpactUseCase;
  listerIndicateursImpactUseCase: ListerIndicateursImpactUseCase;
};

type IndicateursImpactCradle = IndicateursImpactExports;

export const indicateursImpactModule = defineModule<
  IndicateursImpactExports,
  IndicateursImpactCradle
>()({
  name: "indicateursImpact",
  imports: ["shared"],
  exports: [
    "indicateurImpactRepository",
    "creerIndicateurImpactUseCase",
    "listerIndicateursImpactUseCase",
  ],
  register: (container, { asModuleClass }) => {
    container.register({
      indicateurImpactRepository: asModuleClass(
        PrismaIndicateurImpactRepository,
      ),
      creerIndicateurImpactUseCase: asModuleClass(
        CreerIndicateurImpactUseCase,
      ),
      listerIndicateursImpactUseCase: asModuleClass(
        ListerIndicateursImpactUseCase,
      ),
    } satisfies VerifyCradle<IndicateursImpactCradle>);
  },
});

export type Inject<
  K extends keyof ExtractScope<typeof indicateursImpactModule>,
> = Pick<ExtractScope<typeof indicateursImpactModule>, K>;
