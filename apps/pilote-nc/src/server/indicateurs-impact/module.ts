import {
  defineModule,
  type ExtractScope,
  type VerifyCradle,
} from "@/server/module-system";
import PrismaIndicateurImpactRepository from "@/server/indicateurs-impact/infrastructure/PrismaIndicateurImpactRepository";
import IndicateurImpactRepository from "@/server/indicateurs-impact/domain/ports/IndicateurImpactRepository";
import CreerIndicateurImpactUseCase from "@/server/indicateurs-impact/usecases/CreerIndicateurImpactUseCase";
import ListerIndicateursImpactUseCase from "@/server/indicateurs-impact/usecases/ListerIndicateursImpactUseCase";
import ModifierIndicateurImpactUseCase from "@/server/indicateurs-impact/usecases/ModifierIndicateurImpactUseCase";
import SupprimerIndicateurImpactUseCase from "@/server/indicateurs-impact/usecases/SupprimerIndicateurImpactUseCase";

type IndicateursImpactExports = {
  indicateurImpactRepository: IndicateurImpactRepository;
  creerIndicateurImpactUseCase: CreerIndicateurImpactUseCase;
  listerIndicateursImpactUseCase: ListerIndicateursImpactUseCase;
  modifierIndicateurImpactUseCase: ModifierIndicateurImpactUseCase;
  supprimerIndicateurImpactUseCase: SupprimerIndicateurImpactUseCase;
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
    "modifierIndicateurImpactUseCase",
    "supprimerIndicateurImpactUseCase",
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
      modifierIndicateurImpactUseCase: asModuleClass(
        ModifierIndicateurImpactUseCase,
      ),
      supprimerIndicateurImpactUseCase: asModuleClass(
        SupprimerIndicateurImpactUseCase,
      ),
    } satisfies VerifyCradle<IndicateursImpactCradle>);
  },
});

export type Inject<
  K extends keyof ExtractScope<typeof indicateursImpactModule>,
> = Pick<ExtractScope<typeof indicateursImpactModule>, K>;
