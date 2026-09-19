import { créerRouteurTRPC, procédureProtégée } from "../trpc";

export const profilUtilisateurRouter = créerRouteurTRPC({
  getUtilisateurConnecte: procédureProtégée.query(({ ctx }) => {
    return {
      id: ctx.session.user.id,
      email: ctx.session.user.email,
      profil: ctx.session.profil,
      transparenceGlobale: ctx.session.transparenceGlobale,
      habilitationsSecteur: ctx.session.habilitationsSecteur,
    };
  }),
});
