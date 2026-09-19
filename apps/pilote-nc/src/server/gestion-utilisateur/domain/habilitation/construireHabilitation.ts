import Habilitation from "@/server/gestion-utilisateur/domain/habilitation/Habilitation";
import { Habilitations } from "@/server/gestion-utilisateur/domain/habilitation/Habilitation.interface";

/**
 * Construit une `Habilitation` à partir des informations portées par la
 * session NextAuth. Une nouvelle instance par requête : ces informations sont
 * re-fetchées en base à chaque lecture de session (cf. callback `session()`),
 * donc toujours à jour.
 */
export function construireHabilitation(session: Habilitations): Habilitation {
  return new Habilitation({
    profil: session.profil,
    habilitationsSecteur: session.habilitationsSecteur,
    transparenceGlobale: session.transparenceGlobale,
  });
}
