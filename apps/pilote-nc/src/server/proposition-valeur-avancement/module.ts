import {
  defineModule,
  type ExtractScope,
  type VerifyCradle,
} from "@/server/module-system";
import PrismaPvaRepository from "@/server/proposition-valeur-avancement/infrastructure/PrismaPvaRepository";
import PvaRepository from "@/server/proposition-valeur-avancement/domain/ports/PvaRepository";
import SoumettrePvaUseCase from "@/server/proposition-valeur-avancement/usecases/SoumettrePvaUseCase";
import ListerPvaEnAttenteUseCase from "@/server/proposition-valeur-avancement/usecases/ListerPvaEnAttenteUseCase";
import ValiderPvaUseCase from "@/server/proposition-valeur-avancement/usecases/ValiderPvaUseCase";
import ValiderAvecModificationPvaUseCase from "@/server/proposition-valeur-avancement/usecases/ValiderAvecModificationPvaUseCase";
import RefuserPvaUseCase from "@/server/proposition-valeur-avancement/usecases/RefuserPvaUseCase";
import RecupererHistoriquePvaUseCase from "@/server/proposition-valeur-avancement/usecases/RecupererHistoriquePvaUseCase";
import ListerHistoriqueValeursIndicateurUseCase from "@/server/proposition-valeur-avancement/usecases/ListerHistoriqueValeursIndicateurUseCase";
import ModifierValeurValideePvaUseCase from "@/server/proposition-valeur-avancement/usecases/ModifierValeurValideePvaUseCase";
import IndicateurImpactRepository from "@/server/indicateurs-impact/domain/ports/IndicateurImpactRepository";

type PropositionValeurAvancementExports = {
  pvaRepository: PvaRepository;
  soumettrePvaUseCase: SoumettrePvaUseCase;
  listerPvaEnAttenteUseCase: ListerPvaEnAttenteUseCase;
  validerPvaUseCase: ValiderPvaUseCase;
  validerAvecModificationPvaUseCase: ValiderAvecModificationPvaUseCase;
  refuserPvaUseCase: RefuserPvaUseCase;
  recupererHistoriquePvaUseCase: RecupererHistoriquePvaUseCase;
  listerHistoriqueValeursIndicateurUseCase: ListerHistoriqueValeursIndicateurUseCase;
  modifierValeurValideePvaUseCase: ModifierValeurValideePvaUseCase;
};

// `indicateurImpactRepository` est importé du module `indicateursImpact`
// (câblé en phase 2 de bootModules), pas défini ici.
type PropositionValeurAvancementCradle = PropositionValeurAvancementExports & {
  indicateurImpactRepository: IndicateurImpactRepository;
};

export const propositionValeurAvancementModule = defineModule<
  PropositionValeurAvancementExports,
  PropositionValeurAvancementCradle
>()({
  name: "propositionValeurAvancement",
  imports: ["shared", "indicateursImpact"],
  exports: [
    "pvaRepository",
    "soumettrePvaUseCase",
    "listerPvaEnAttenteUseCase",
    "validerPvaUseCase",
    "validerAvecModificationPvaUseCase",
    "refuserPvaUseCase",
    "recupererHistoriquePvaUseCase",
    "listerHistoriqueValeursIndicateurUseCase",
    "modifierValeurValideePvaUseCase",
  ],
  register: (container, { asModuleClass }) => {
    container.register({
      pvaRepository: asModuleClass(PrismaPvaRepository),
      soumettrePvaUseCase: asModuleClass(SoumettrePvaUseCase),
      listerPvaEnAttenteUseCase: asModuleClass(ListerPvaEnAttenteUseCase),
      validerPvaUseCase: asModuleClass(ValiderPvaUseCase),
      validerAvecModificationPvaUseCase: asModuleClass(
        ValiderAvecModificationPvaUseCase,
      ),
      refuserPvaUseCase: asModuleClass(RefuserPvaUseCase),
      recupererHistoriquePvaUseCase: asModuleClass(
        RecupererHistoriquePvaUseCase,
      ),
      listerHistoriqueValeursIndicateurUseCase: asModuleClass(
        ListerHistoriqueValeursIndicateurUseCase,
      ),
      modifierValeurValideePvaUseCase: asModuleClass(
        ModifierValeurValideePvaUseCase,
      ),
    } satisfies VerifyCradle<PropositionValeurAvancementExports>);
  },
});

export type Inject<
  K extends keyof ExtractScope<typeof propositionValeurAvancementModule>,
> = Pick<ExtractScope<typeof propositionValeurAvancementModule>, K>;
