import { bootModules, moduleNames, type ModuleName } from "@/server/module-system";
import { sharedModule } from "@/server/shared/module";
import { gestionUtilisateurModule } from "@/server/gestion-utilisateur/module";
import { secteursModule } from "@/server/secteurs/module";
import { directionsModule } from "@/server/directions/module";
import { mesuresModule } from "@/server/mesures/module";
import { actionsModule } from "@/server/actions/module";
import { indicateursImpactModule } from "@/server/indicateurs-impact/module";
import { propositionValeurAvancementModule } from "@/server/proposition-valeur-avancement/module";
import { journalModule } from "@/server/journal/module";
import { droitsModule } from "@/server/droits/module";

const allModules = [
  sharedModule,
  gestionUtilisateurModule,
  secteursModule,
  directionsModule,
  mesuresModule,
  actionsModule,
  indicateursImpactModule,
  propositionValeurAvancementModule,
  journalModule,
  droitsModule,
];

// Échoue à la compilation si `allModules` ne couvre pas tous les noms
// déclarés dans `moduleNames.ts`.
type ModulesCouverts = (typeof allModules)[number]["name"];
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _AssertExhaustiveModules = ModuleName extends ModulesCouverts
  ? true
  : ["Module manquant dans allModules :", Exclude<ModuleName, ModulesCouverts>];

const registerContainer = () => {
  const { getContainer } = bootModules(allModules);

  return {
    shared: getContainer("shared"),
    gestionUtilisateur: getContainer("gestionUtilisateur"),
    secteurs: getContainer("secteurs"),
    directions: getContainer("directions"),
    mesures: getContainer("mesures"),
    actions: getContainer("actions"),
    indicateursImpact: getContainer("indicateursImpact"),
    propositionValeurAvancement: getContainer("propositionValeurAvancement"),
    journal: getContainer("journal"),
    droits: getContainer("droits"),
  };
};

type ContainerDependencies = ReturnType<typeof registerContainer>;

declare global {
  // eslint-disable-next-line no-var
  var __container: ContainerDependencies | undefined;
}

const innerContainer: ContainerDependencies =
  process.env.NODE_ENV === "production"
    ? (global.__container ??= registerContainer())
    : registerContainer();

export const getContainer = <N extends keyof ContainerDependencies>(
  name: N,
): ContainerDependencies[N] => innerContainer[name];

// Référence `moduleNames` pour garder l'import utilisé par le check
// d'exhaustivité ci-dessus lisible depuis ce fichier.
export { moduleNames };
