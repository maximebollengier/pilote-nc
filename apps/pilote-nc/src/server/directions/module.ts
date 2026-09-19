import {
  defineModule,
  type ExtractScope,
  type VerifyCradle,
} from "@/server/module-system";
import PrismaDirectionRepository from "@/server/directions/infrastructure/PrismaDirectionRepository";
import DirectionRepository from "@/server/directions/domain/ports/DirectionRepository";
import CreerDirectionUseCase from "@/server/directions/usecases/CreerDirectionUseCase";
import ListerDirectionsUseCase from "@/server/directions/usecases/ListerDirectionsUseCase";
import ModifierDirectionUseCase from "@/server/directions/usecases/ModifierDirectionUseCase";
import SupprimerDirectionUseCase from "@/server/directions/usecases/SupprimerDirectionUseCase";
import UtilisateurRepository from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";

type DirectionsExports = {
  directionRepository: DirectionRepository;
  creerDirectionUseCase: CreerDirectionUseCase;
  listerDirectionsUseCase: ListerDirectionsUseCase;
  modifierDirectionUseCase: ModifierDirectionUseCase;
  supprimerDirectionUseCase: SupprimerDirectionUseCase;
};

// `utilisateurRepository` est importé du module `gestionUtilisateur` (câblé en
// phase 2 de bootModules) — utilisé pour empêcher la suppression d'une
// direction qui a encore des utilisateurs rattachés.
type DirectionsCradle = DirectionsExports & {
  utilisateurRepository: UtilisateurRepository;
};

export const directionsModule = defineModule<
  DirectionsExports,
  DirectionsCradle
>()({
  name: "directions",
  imports: ["shared", "gestionUtilisateur"],
  exports: [
    "directionRepository",
    "creerDirectionUseCase",
    "listerDirectionsUseCase",
    "modifierDirectionUseCase",
    "supprimerDirectionUseCase",
  ],
  register: (container, { asModuleClass }) => {
    container.register({
      directionRepository: asModuleClass(PrismaDirectionRepository),
      creerDirectionUseCase: asModuleClass(CreerDirectionUseCase),
      listerDirectionsUseCase: asModuleClass(ListerDirectionsUseCase),
      modifierDirectionUseCase: asModuleClass(ModifierDirectionUseCase),
      supprimerDirectionUseCase: asModuleClass(SupprimerDirectionUseCase),
    } satisfies VerifyCradle<DirectionsExports>);
  },
});

export type Inject<K extends keyof ExtractScope<typeof directionsModule>> =
  Pick<ExtractScope<typeof directionsModule>, K>;
