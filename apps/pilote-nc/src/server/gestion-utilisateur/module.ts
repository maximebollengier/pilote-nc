import {
  defineModule,
  type ExtractScope,
  type VerifyCradle,
} from "@/server/module-system";
import PrismaUtilisateurRepository from "@/server/gestion-utilisateur/infrastructure/PrismaUtilisateurRepository";
import UtilisateurRepository from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";
import RecupererUnUtilisateurUseCase from "@/server/gestion-utilisateur/usecases/RecupererUnUtilisateurUseCase";
import ListerUtilisateursUseCase from "@/server/gestion-utilisateur/usecases/ListerUtilisateursUseCase";
import ModifierHabilitationsSecteurUseCase from "@/server/gestion-utilisateur/usecases/ModifierHabilitationsSecteurUseCase";
import CreerUtilisateurUseCase from "@/server/gestion-utilisateur/usecases/CreerUtilisateurUseCase";

type GestionUtilisateurExports = {
  utilisateurRepository: UtilisateurRepository;
  recupererUnUtilisateurUseCase: RecupererUnUtilisateurUseCase;
  listerUtilisateursUseCase: ListerUtilisateursUseCase;
  modifierHabilitationsSecteurUseCase: ModifierHabilitationsSecteurUseCase;
  creerUtilisateurUseCase: CreerUtilisateurUseCase;
};

type GestionUtilisateurCradle = GestionUtilisateurExports;

export const gestionUtilisateurModule = defineModule<
  GestionUtilisateurExports,
  GestionUtilisateurCradle
>()({
  name: "gestionUtilisateur",
  imports: ["shared"],
  exports: [
    "utilisateurRepository",
    "recupererUnUtilisateurUseCase",
    "listerUtilisateursUseCase",
    "modifierHabilitationsSecteurUseCase",
    "creerUtilisateurUseCase",
  ],
  register: (container, { asModuleClass }) => {
    container.register({
      utilisateurRepository: asModuleClass(PrismaUtilisateurRepository),
      recupererUnUtilisateurUseCase: asModuleClass(
        RecupererUnUtilisateurUseCase,
      ),
      listerUtilisateursUseCase: asModuleClass(ListerUtilisateursUseCase),
      modifierHabilitationsSecteurUseCase: asModuleClass(
        ModifierHabilitationsSecteurUseCase,
      ),
      creerUtilisateurUseCase: asModuleClass(CreerUtilisateurUseCase),
    } satisfies VerifyCradle<GestionUtilisateurCradle>);
  },
});

export type Inject<K extends keyof ExtractScope<typeof gestionUtilisateurModule>> =
  Pick<ExtractScope<typeof gestionUtilisateurModule>, K>;
