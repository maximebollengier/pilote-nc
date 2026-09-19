import {
  defineModule,
  type ExtractScope,
  type VerifyCradle,
} from "@/server/module-system";
import PrismaActionRepository from "@/server/actions/infrastructure/PrismaActionRepository";
import ActionRepository from "@/server/actions/domain/ports/ActionRepository";
import CreerActionUseCase from "@/server/actions/usecases/CreerActionUseCase";
import ListerActionsUseCase from "@/server/actions/usecases/ListerActionsUseCase";
import ListerToutesActionsUseCase from "@/server/actions/usecases/ListerToutesActionsUseCase";
import SaisirAvancementActionUseCase from "@/server/actions/usecases/SaisirAvancementActionUseCase";
import ModifierDatesPrevisionnellesActionUseCase from "@/server/actions/usecases/ModifierDatesPrevisionnellesActionUseCase";
import DefinirBlocageActionUseCase from "@/server/actions/usecases/DefinirBlocageActionUseCase";
import SupprimerActionUseCase from "@/server/actions/usecases/SupprimerActionUseCase";
import RecalculerMeteoMesureUseCase from "@/server/mesures/usecases/RecalculerMeteoMesureUseCase";

type ActionsExports = {
  actionRepository: ActionRepository;
  creerActionUseCase: CreerActionUseCase;
  listerActionsUseCase: ListerActionsUseCase;
  listerToutesActionsUseCase: ListerToutesActionsUseCase;
  saisirAvancementActionUseCase: SaisirAvancementActionUseCase;
  modifierDatesPrevisionnellesActionUseCase: ModifierDatesPrevisionnellesActionUseCase;
  definirBlocageActionUseCase: DefinirBlocageActionUseCase;
  supprimerActionUseCase: SupprimerActionUseCase;
};

// `recalculerMeteoMesureUseCase` est importé du module `mesures` (dépendance
// inter-modules, câblée en phase 2 de bootModules), pas défini ici.
type ActionsCradle = ActionsExports & {
  recalculerMeteoMesureUseCase: RecalculerMeteoMesureUseCase;
};

export const actionsModule = defineModule<ActionsExports, ActionsCradle>()({
  name: "actions",
  imports: ["shared", "mesures"],
  exports: [
    "actionRepository",
    "creerActionUseCase",
    "listerActionsUseCase",
    "listerToutesActionsUseCase",
    "saisirAvancementActionUseCase",
    "modifierDatesPrevisionnellesActionUseCase",
    "definirBlocageActionUseCase",
    "supprimerActionUseCase",
  ],
  register: (container, { asModuleClass }) => {
    container.register({
      actionRepository: asModuleClass(PrismaActionRepository),
      creerActionUseCase: asModuleClass(CreerActionUseCase),
      listerActionsUseCase: asModuleClass(ListerActionsUseCase),
      listerToutesActionsUseCase: asModuleClass(ListerToutesActionsUseCase),
      saisirAvancementActionUseCase: asModuleClass(
        SaisirAvancementActionUseCase,
      ),
      modifierDatesPrevisionnellesActionUseCase: asModuleClass(
        ModifierDatesPrevisionnellesActionUseCase,
      ),
      definirBlocageActionUseCase: asModuleClass(DefinirBlocageActionUseCase),
      supprimerActionUseCase: asModuleClass(SupprimerActionUseCase),
    } satisfies VerifyCradle<ActionsExports>);
  },
});

export type Inject<K extends keyof ExtractScope<typeof actionsModule>> = Pick<
  ExtractScope<typeof actionsModule>,
  K
>;
