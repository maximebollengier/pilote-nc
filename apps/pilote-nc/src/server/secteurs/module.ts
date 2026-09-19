import {
  defineModule,
  type ExtractScope,
  type VerifyCradle,
} from "@/server/module-system";
import PrismaSecteurRepository from "@/server/secteurs/infrastructure/PrismaSecteurRepository";
import SecteurRepository from "@/server/secteurs/domain/ports/SecteurRepository";
import CreerSecteurUseCase from "@/server/secteurs/usecases/CreerSecteurUseCase";
import ListerSecteursUseCase from "@/server/secteurs/usecases/ListerSecteursUseCase";
import ModifierSecteurUseCase from "@/server/secteurs/usecases/ModifierSecteurUseCase";
import SupprimerSecteurUseCase from "@/server/secteurs/usecases/SupprimerSecteurUseCase";
import MesureRepository from "@/server/mesures/domain/ports/MesureRepository";

type SecteursExports = {
  secteurRepository: SecteurRepository;
  creerSecteurUseCase: CreerSecteurUseCase;
  listerSecteursUseCase: ListerSecteursUseCase;
  modifierSecteurUseCase: ModifierSecteurUseCase;
  supprimerSecteurUseCase: SupprimerSecteurUseCase;
};

// `mesureRepository` est importé du module `mesures` (câblé en phase 2 de
// bootModules), pas défini ici — utilisé pour empêcher la suppression d'un
// secteur qui a encore des mesures actives.
type SecteursCradle = SecteursExports & {
  mesureRepository: MesureRepository;
};

export const secteursModule = defineModule<SecteursExports, SecteursCradle>()({
  name: "secteurs",
  imports: ["shared", "mesures"],
  exports: [
    "secteurRepository",
    "creerSecteurUseCase",
    "listerSecteursUseCase",
    "modifierSecteurUseCase",
    "supprimerSecteurUseCase",
  ],
  register: (container, { asModuleClass }) => {
    container.register({
      secteurRepository: asModuleClass(PrismaSecteurRepository),
      creerSecteurUseCase: asModuleClass(CreerSecteurUseCase),
      listerSecteursUseCase: asModuleClass(ListerSecteursUseCase),
      modifierSecteurUseCase: asModuleClass(ModifierSecteurUseCase),
      supprimerSecteurUseCase: asModuleClass(SupprimerSecteurUseCase),
    } satisfies VerifyCradle<SecteursExports>);
  },
});

export type Inject<K extends keyof ExtractScope<typeof secteursModule>> =
  Pick<ExtractScope<typeof secteursModule>, K>;
