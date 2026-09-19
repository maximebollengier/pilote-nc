export const moduleNames = [
  "shared",
  "gestionUtilisateur",
  "secteurs",
  "directions",
  "mesures",
  "actions",
  "indicateursImpact",
  "propositionValeurAvancement",
  "journal",
  "droits",
] as const;

export type ModuleName = (typeof moduleNames)[number];
